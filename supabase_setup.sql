-- 0. SCHEMA AUTH (Simulação Supabase Auth para Vanilla Postgres)
create schema if not exists auth;

create table if not exists auth.users (
    id uuid not null primary key,
    instance_id uuid,
    email text,
    encrypted_password text,
    email_confirmed_at timestamp
    with
        time zone,
        invited_at timestamp
    with
        time zone,
        confirmation_token text,
        confirmation_sent_at timestamp
    with
        time zone,
        recovery_token text,
        recovery_sent_at timestamp
    with
        time zone,
        email_change_token_new text,
        email_change text,
        email_change_sent_at timestamp
    with
        time zone,
        last_sign_in_at timestamp
    with
        time zone,
        raw_app_meta_data jsonb,
        raw_user_meta_data jsonb,
        is_super_admin boolean,
        created_at timestamp
    with
        time zone,
        updated_at timestamp
    with
        time zone,
        phone text,
        phone_confirmed_at timestamp
    with
        time zone,
        phone_change text,
        phone_change_token text,
        phone_change_sent_at timestamp
    with
        time zone,
        confirmed_at timestamp
    with
        time zone,
        email_change_token_current text,
        email_change_confirm_status smallint,
        banned_until timestamp
    with
        time zone,
        reauthentication_token text,
        reauthentication_sent_at timestamp
    with
        time zone,
        is_sso_user boolean default false not null,
        deleted_at timestamp
    with
        time zone
);

comment on
table auth.users is 'Auth: Stores user login data within a secure schema.';

-- Habilitar UUIDs
create extension if not exists "uuid-ossp";

-- Function for auth.uid() mocking
create or replace function auth.uid() returns uuid as $$
  select null::uuid;
$$ language sql stable;

-- 1. TABELA DE PERFIS (PROFILES)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text check (role in ('CLIENT', 'PROFESSIONAL', 'SPACE')),
  avatar text,
  bio text,
  karma integer default 0,
  streak integer default 0,
  multiplier numeric default 1, 
  personal_balance numeric default 0,
  corporate_balance numeric default 0,
  plant_xp integer default 0,
  plant_stage text default 'seed',
  location text,
  specialty text[],
  hub_id uuid, -- Para vincular profissionais a um Santuário (Space)
  rating numeric default 5.0, -- Média de avaliações
  review_count integer default 0, -- Total de avaliações
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Policies won't strictly enforce if we use Service Role in Prisma, but kept for compatibility)
alter table public.profiles enable row level security;

create policy "Perfis públicos" on public.profiles for
select using (true);
-- Mocking auth.uid() makes these policies permissive or restrictive depending on implementation
-- We will rely on Application Logic (Prisma) for authorization in this stress test phase

-- 2. TABELA DE AGENDAMENTOS
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id),
  professional_id uuid references public.profiles(id),
  service_name text not null,
  professional_name text,
  client_name text,
  date timestamp with time zone not null,
  time text not null,
  price numeric not null,
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE PRODUTOS
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  image text,
  category text,
  type text,
  description text,
  owner_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABELA DE NOTIFICAÇÕES
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  type text,
  title text not null,
  message text not null,
  read boolean default false,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TRANSAÇÕES
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  type text,
  amount numeric not null,
  description text,
  status text default 'completed',
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. NOTAS DE PRONTUÁRIO
create table public.patient_notes (
  id uuid default uuid_generate_v4() primary key,
  professional_id uuid references public.profiles(id) not null,
  patient_id uuid references public.profiles(id) not null,
  content text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(professional_id, patient_id)
);

-- 7. VAGAS E RECRUTAMENTO
create table public.vacancies (
  id uuid default uuid_generate_v4() primary key,
  hub_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  specialties text[],
  status text default 'open',
  applicants_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.vacancy_applications (
  id uuid default uuid_generate_v4() primary key,
  vacancy_id uuid references public.vacancies(id),
  professional_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(vacancy_id, professional_id)
);

-- 8. SALAS DO HUB
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  hub_id uuid references public.profiles(id) not null,
  name text not null,
  status text default 'available', -- available, occupied
  current_occupant text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. AVALIAÇÕES (REVIEWS)
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  target_id uuid references public.profiles(id) not null, -- Quem está sendo avaliado (Pro/Space)
  author_id uuid references public.profiles(id) not null, -- Quem avaliou
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. TRIGGER PARA NOVOS USUÁRIOS (Replicação User -> Profile)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, avatar, multiplier, personal_balance)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    coalesce(new.raw_user_meta_data->>'role', 'CLIENT'),
    'https://api.dicebear.com/7.x/notionists/svg?seed=' || new.id,
    1,
    1000 -- Bônus inicial
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA (Produtos iniciais)
insert into
    public.products (
        name,
        price,
        image,
        category,
        type,
        description
    )
values (
        'Cristal de Quartzo',
        50.00,
        'https://images.unsplash.com/photo-1515023115689-589c33041d3c',
        'Cristais',
        'physical',
        'Pedra de cura.'
    ),
    (
        'Tapete de Yoga',
        120.00,
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f',
        'Acessórios',
        'physical',
        'Tapete ecológico.'
    ),
    (
        'Meditação MP3',
        29.90,
        'https://images.unsplash.com/photo-1514525253344-f81bad1b7fc7',
        'Digital',
        'digital_content',
        'Áudio para sono.'
    );