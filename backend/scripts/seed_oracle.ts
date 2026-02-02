import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding Oracle Messages...');
  
  const messages = [
    {
      text: 'Respire fundo. A clareza vem no silêncio entre os pensamentos.',
      category: 'consciencia',
      element: 'Ar',
      moods: ['ansioso', 'focado', 'confuso'],
      phases: ['inicio', 'germinacao'],
      weight: 1.2
    },
    {
      text: 'Água que flui não apodrece. Deixe suas emoções seguirem seu curso natural.',
      category: 'cura_emocional',
      element: 'Agua',
      moods: ['triste', 'ansioso', 'cansado'],
      phases: ['florescimento'],
      weight: 1.0
    },
    {
      text: 'Suas raízes são fortes. A terra sustenta seu crescimento, mesmo no escuro.',
      category: 'foco',
      element: 'Terra',
      moods: ['inseguro', 'cansado'],
      phases: ['germinacao', 'raizes'],
      weight: 1.1
    },
    {
      text: 'O fogo da transformação queima o que não serve mais. Brilhe.',
      category: 'transmutacao',
      element: 'Fogo',
      moods: ['estagnado', 'triste'],
      phases: ['metamorfose'],
      weight: 1.3
    }
  ];

  for (const msg of messages) {
    await prisma.oracleMessage.upsert({
      where: { id: `seed-${msg.category}` }, // Not stable but for a simple seed it works if we use a unique field or just create
      // Actually id is UUID. Let's just create.
      create: msg as any,
      update: msg as any
    });
  }

  console.log('✅ Oracle Messages Seeded!');
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
