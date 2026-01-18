const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const SPECIALTIES = ["Reiki", "Yoga", "Acupuntura", "Meditação", "Massagem", "Aromaterapia", "Tarot", "Constelação", "Naturopatia", "Cristais"];
    const NAMES = ["Ana", "Bruno", "Carla", "Daniel", "Elena", "Fábio", "Gabriela", "Hugo", "Isabela", "João", "Karina", "Lucas", "Marina", "Nicolas", "Olívia", "Pedro", "Queila", "Rafael", "Sofia", "Tiago"];
    const SURNAMES = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Ferreira", "Costa", "Rodrigues", "Almeida"];

    const clinics = await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
            prisma.clinic.create({
                data: {
                    name: `Espaço ${['Luz', 'Vida', 'Zen', 'Cura', 'Holístico'][i % 5]} ${['Integral', 'Natural', 'Solar', 'Lunar', 'Gaya'][i % 5]}`,
                    address: `Rua das Flores, ${100 + i}, São Paulo`,
                    rating: 4.8 + (Math.random() * 0.2),
                    image: `https://images.unsplash.com/photo-${1519834785169 + i}?auto=format&fit=crop&w=150&h=150`,
                    specialties: [SPECIALTIES[i % SPECIALTIES.length], SPECIALTIES[(i + 1) % SPECIALTIES.length]].join(','),
                    verified: true,
                    description: 'Um espaço dedicado ao seu bem-estar integral, com terapeutas certificados e ambiente acolhedor.',
                    amenities: ['Wi-Fi', 'Estacionamento', 'Chá e Café', 'Acessibilidade'].join(','),
                },
            })
        )
    );

    const professionals = await Promise.all(
        Array.from({ length: 20 }).map((_, i) => {
            const clinic = clinics[Math.floor(Math.random() * clinics.length)];
            return prisma.professional.create({
                data: {
                    name: `${NAMES[i % NAMES.length]} ${SURNAMES[i % SURNAMES.length]}`,
                    role: `Terapeuta de ${SPECIALTIES[i % SPECIALTIES.length]}`,
                    avatarUrl: `https://i.pravatar.cc/150?u=p${i}`,
                    rating: 4.5 + (Math.random() * 0.5),
                    price: 150 + Math.floor(Math.random() * 200),
                    specialties: [SPECIALTIES[i % SPECIALTIES.length]].join(','),
                    clinicId: clinic.id,
                    clinicName: clinic.name,
                    location: Math.random() > 0.4 ? 'São Paulo, SP' : 'Atendimento Online',
                    verified: Math.random() > 0.2,
                    badges: Math.random() > 0.5 ? 'Acolhedor' : '',
                    nextSession: '14:00',
                    bio: 'Especialista em terapias integrativas com foco no equilíbrio corpo-mente. Minha missão é proporcionar um espaço seguro de cura e autoconhecimento.',
                },
            });
        })
    );

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
