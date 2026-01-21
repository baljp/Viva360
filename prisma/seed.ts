import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../backend/src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vacancy.deleteMany();
  await prisma.room.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.space.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Dados antigos removidos');

  // Create clients
  const client1 = await prisma.user.create({
    data: {
      email: 'ana@viva360.com',
      password: await hashPassword('senha123'),
      name: 'Ana Silva',
      role: 'CLIENT',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ana',
      bio: 'Buscando equilíbrio e bem-estar',
      karma: 250,
      streak: 5,
      plantStage: 'SPROUT',
      plantXp: 150,
      personalBalance: 1000,
      corporateBalance: 500,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'carlos@viva360.com',
      password: await hashPassword('senha123'),
      name: 'Carlos Mendes',
      role: 'CLIENT',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Carlos',
      bio: 'Em transformação pessoal',
      karma: 150,
      streak: 2,
      plantStage: 'SEED',
      plantXp: 80,
      personalBalance: 750,
    },
  });

  console.log('✅ Clientes criados');

  // Create professionals
  const pro1User = await prisma.user.create({
    data: {
      email: 'luna@viva360.com',
      password: await hashPassword('senha123'),
      name: 'Luna Celestial',
      role: 'PROFESSIONAL',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Luna',
      bio: 'Terapeuta holística e guia espiritual',
      karma: 1500,
      streak: 30,
      plantStage: 'FLOWER',
      plantXp: 800,
      isVerified: true,
    },
  });

  await prisma.professional.create({
    data: {
      userId: pro1User.id,
      specialty: JSON.stringify(['Terapia Holística', 'Astrologia', 'Tarot']),
      rating: 4.9,
      reviewCount: 127,
      pricePerSession: 150,
      totalHealingHours: 340,
      location: 'São Paulo, SP',
      licenseNumber: 'TH-2024-0001',
      isAvailableForSwap: true,
      offers: JSON.stringify(['Consultas de Tarot', 'Mapa Astral']),
      needs: JSON.stringify(['Terapia Corporal', 'Reiki']),
    },
  });

  const pro2User = await prisma.user.create({
    data: {
      email: 'marcus@viva360.com',
      password: await hashPassword('senha123'),
      name: 'Marcus Zen',
      role: 'PROFESSIONAL',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus',
      bio: 'Instrutor de Yoga e Meditação',
      karma: 1200,
      streak: 45,
      plantStage: 'TREE',
      plantXp: 1200,
      isVerified: true,
    },
  });

  await prisma.professional.create({
    data: {
      userId: pro2User.id,
      specialty: JSON.stringify(['Yoga', 'Meditação', 'Mindfulness']),
      rating: 5.0,
      reviewCount: 89,
      pricePerSession: 120,
      totalHealingHours: 520,
      location: 'Rio de Janeiro, RJ',
      licenseNumber: 'YG-2024-0042',
    },
  });

  const pro3User = await prisma.user.create({
    data: {
      email: 'dra.silva@viva360.com',
      password: await hashPassword('senha123'),
      name: 'Dra. Isabel Silva',
      role: 'PROFESSIONAL',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Isabel',
      bio: 'Psicóloga Clínica especialista em Terapia Integrativa',
      karma: 2000,
      streak: 60,
      plantStage: 'TREE',
      plantXp: 1500,
      isVerified: true,
    },
  });

  await prisma.professional.create({
    data: {
      userId: pro3User.id,
      specialty: JSON.stringify(['Psicologia', 'Terapia Cognitiva', 'Constelação Familiar']),
      rating: 4.8,
      reviewCount: 215,
      pricePerSession: 200,
      totalHealingHours: 890,
      location: 'Belo Horizonte, MG',
      licenseNumber: 'CRP-04/12345',
    },
  });

  console.log('✅ Profissionais criados');

  // Create space
  const spaceUser = await prisma.user.create({
    data: {
      email: 'contato@sanctuarium.com',
      password: await hashPassword('senha123'),
      name: 'Sanctuarium Espaço Holístico',
      role: 'SPACE',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Sanctuarium',
      bio: 'Centro holístico completo no coração da cidade',
      karma: 800,
      isVerified: true,
    },
  });

  const space = await prisma.space.create({
    data: {
      userId: spaceUser.id,
      spaceName: 'Sanctuarium',
      address: 'Rua da Harmonia, 360',
      city: 'São Paulo, SP',
      capacity: 50,
      amenities: JSON.stringify(['Salas de Terapia', 'Jardim Zen', 'Área de Meditação', 'Loja Holística']),
    },
  });

  // Create rooms for space
  await prisma.room.createMany({
    data: [
      {
        name: 'Sala Lua Nova',
        status: 'available',
        spaceId: space.id,
      },
      {
        name: 'Sala Sol Radiante',
        status: 'occupied',
        currentOccupant: 'Luna Celestial',
        spaceId: space.id,
      },
      {
        name: 'Sala Cristal',
        status: 'available',
        spaceId: space.id,
      }
    ],
  });

  console.log('✅ Espaço e salas criados');

  // Create appointments
  const appointment1 = await prisma.appointment.create({
    data: {
      clientId: client1.id,
      professionalId: pro1User.id,
      serviceName: 'Consulta de Tarot',
      price: 150,
      date: new Date('2026-02-05'),
      time: '14:00',
      status: 'CONFIRMED',
      duration: 60,
    },
  });

  await prisma.appointment.create({
    data: {
      clientId: client2.id,
      professionalId: pro2User.id,
      serviceName: 'Aula de Yoga',
      price: 120,
      date: new Date('2026-02-10'),
      time: '09:00',
      status: 'PENDING',
      duration: 90,
    },
  });

  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      professionalId: pro3User.id,
      serviceName: 'Sessão de Terapia',
      price: 200,
      date: new Date('2026-01-15'),
      time: '16:00',
      status: 'COMPLETED',
      duration: 60,
      notes: 'Cliente apresentou ótima evolução no processo terapêutico.',
    },
  });

  console.log('✅ Agendamentos criados');

  // Create products
  await prisma.product.createMany({
    data: [
      {
        name: 'Cristal de Quartzo Rosa',
        description: 'Cristal natural para amor e harmonia',
        price: 45,
        image: 'https://images.unsplash.com/photo-1518281361980-b26bfd556770?w=400',
        category: 'Cristais',
        type: 'PHYSICAL',
        stock: 15,
      },
      {
        name: 'Incenso de Sândalo',
        description: 'Pacote com 20 varetas aromáticas',
        price: 25,
        image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400',
        category: 'Aromaterapia',
        type: 'PHYSICAL',
        stock: 50,
      },
      {
        name: 'E-book: Guia de Meditação',
        description: 'Aprenda técnicas de meditação para iniciantes',
        price: 29.90,
        image: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=400',
        category: 'Digital',
        type: 'DIGITAL_CONTENT',
        stock: 999,
      },
    ],
  });

  console.log('✅ Produtos criados');

  // Create transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: client1.id,
        type: 'EXPENSE',
        amount: 150,
        description: 'Agendamento: Consulta de Tarot',
        reference: appointment1.id,
        status: 'COMPLETED',
      },
      {
        userId: pro1User.id,
        type: 'INCOME',
        amount: 150,
        description: 'Sessão concluída: Consulta de Tarot',
        reference: appointment1.id,
        status: 'COMPLETED',
      },
    ],
  });

  console.log('✅ Transações criadas');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: client1.id,
        type: 'APPOINTMENT',
        title: 'Agendamento Confirmado',
        message: 'Sua consulta com Luna Celestial foi confirmada para 05/02',
        actionUrl: `/appointments/${appointment1.id}`,
        read: false,
      },
      {
        userId: pro1User.id,
        type: 'APPOINTMENT',
        title: 'Novo Agendamento',
        message: 'Ana Silva agendou Consulta de Tarot',
        actionUrl: `/appointments/${appointment1.id}`,
        read: false,
      },
    ],
  });

  console.log('✅ Notificações criadas');

  // Create vacancy
  await prisma.vacancy.create({
    data: {
      spaceId: space.id,
      title: 'Terapeuta Holístico',
      description: 'Buscamos profissional com experiência em terapias integrativas',
      specialties: JSON.stringify(['Reiki', 'Massagem', 'Aromaterapia']),
      status: 'OPEN',
      applicantsCount: 3,
    },
  });

  console.log('✅ Vaga criada');

  console.log('\n🎉 Seed concluído com sucesso!\n');
  console.log('Usuários de teste:');
  console.log('  Cliente: ana@viva360.com / senha123');
  console.log('  Profissional: luna@viva360.com / senha123');
  console.log('  Espaço: contato@sanctuarium.com / senha123\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
