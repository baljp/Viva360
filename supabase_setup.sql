
-- Habilitar UUIDs
create extension if not exists "uuid-ossp";

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

-- Habilitar RLS
alter table public.profiles enable row level security;

create policy "Perfis públicos" on public.profiles for select using (true);
create policy "Usuário edita dados básicos" on public.profiles for update using (auth.uid() = id);
create policy "Sistema cria perfil" on public.profiles for insert with check (auth.uid() = id);


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

alter table public.appointments enable row level security;

create policy "Ver meus agendamentos" on public.appointments for select 
  using (auth.uid() = client_id or auth.uid() = professional_id);

create policy "Criar agendamento" on public.appointments for insert 
  with check (auth.uid() = client_id);

create policy "Atualizar agendamento" on public.appointments for update 
  using (auth.uid() = client_id or auth.uid() = professional_id);


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

alter table public.products enable row level security;

create policy "Ver produtos" on public.products for select using (true);

create policy "Profissionais criam produtos" on public.products for insert 
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('PROFESSIONAL', 'SPACE')
    )
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

alter table public.notifications enable row level security;

create policy "Ver minhas notificações" on public.notifications for select using (auth.uid() = user_id);
create policy "Criar notificações" on public.notifications for insert with check (true); 
create policy "Atualizar notificações" on public.notifications for update using (auth.uid() = user_id);


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

alter table public.transactions enable row level security;
create policy "Ver minhas transações" on public.transactions for select using (auth.uid() = user_id);


-- 6. NOTAS DE PRONTUÁRIO
create table public.patient_notes (
  id uuid default uuid_generate_v4() primary key,
  professional_id uuid references public.profiles(id) not null,
  patient_id uuid references public.profiles(id) not null,
  content text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(professional_id, patient_id)
);

alter table public.patient_notes enable row level security;
create policy "Profissional vê e edita suas notas" on public.patient_notes for all using (auth.uid() = professional_id);


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

alter table public.vacancies enable row level security;
create policy "Ver vagas" on public.vacancies for select using (true);
create policy "Hub gerencia vagas" on public.vacancies for all using (auth.uid() = hub_id);

create table public.vacancy_applications (
  id uuid default uuid_generate_v4() primary key,
  vacancy_id uuid references public.vacancies(id),
  professional_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(vacancy_id, professional_id)
);
alter table public.vacancy_applications enable row level security;
create policy "Candidatar-se" on public.vacancy_applications for insert with check (auth.uid() = professional_id);
create policy "Hub vê candidatos" on public.vacancy_applications for select using (
  exists (select 1 from public.vacancies where id = vacancy_applications.vacancy_id and hub_id = auth.uid())
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
alter table public.rooms enable row level security;
create policy "Ver salas" on public.rooms for select using (true);
create policy "Hub gerencia salas" on public.rooms for all using (auth.uid() = hub_id);


-- 9. AVALIAÇÕES (REVIEWS) - NOVA TABELA
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  target_id uuid references public.profiles(id) not null, -- Quem está sendo avaliado (Pro/Space)
  author_id uuid references public.profiles(id) not null, -- Quem avaliou
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reviews enable row level security;
create policy "Ver avaliações públicas" on public.reviews for select using (true);
create policy "Autores criam avaliações" on public.reviews for insert with check (auth.uid() = author_id);


-- 10. FUNÇÃO SEGURA DE PAGAMENTO (RPC)
create or replace function public.process_payment(
  amount numeric, 
  description text,
  receiver_id uuid default null 
) 
returns json as $$
declare
  user_balance numeric;
  new_balance numeric;
begin
  select personal_balance into user_balance from public.profiles where id = auth.uid();
  
  if user_balance < amount then
    raise exception 'Saldo insuficiente para realizar esta transação.';
  end if;

  update public.profiles 
  set personal_balance = personal_balance - amount,
      karma = karma + (amount * 2)::int,
      plant_xp = plant_xp + (amount / 10)::int
  where id = auth.uid()
  returning personal_balance into new_balance;

  insert into public.transactions (user_id, type, amount, description)
  values (auth.uid(), 'expense', amount, description);

  if receiver_id is not null then
    update public.profiles 
    set personal_balance = personal_balance + amount 
    where id = receiver_id;

    insert into public.transactions (user_id, type, amount, description)
    values (receiver_id, 'income', amount, 'Recebido: ' || description);
  end if;

  return json_build_object('success', true, 'new_balance', new_balance);
end;
$$ language plpgsql security definer;


-- 11. TRIGGER PARA NOVOS USUÁRIOS
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
insert into public.products (name, price, image, category, type, description) values
('Cristal de Quartzo', 50.00, 'https://images.unsplash.com/photo-1515023115689-589c33041d3c', 'Cristais', 'physical', 'Pedra de cura.'),
('Tapete de Yoga', 120.00, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', 'Acessórios', 'physical', 'Tapete ecológico.'),
('Meditação MP3', 29.90, 'https://images.unsplash.com/photo-1514525253344-f81bad1b7fc7', 'Digital', 'digital_content', 'Áudio para sono.');
