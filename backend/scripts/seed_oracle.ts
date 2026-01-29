
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MESSAGES = [
    // --- Cura Emocional (Agua) ---
    {
        text: "Respire. Você já atravessou dias mais difíceis do que este.",
        category: "cura_emocional",
        element: "Agua",
        moods: ["ansioso", "triste"],
        phases: ["germinacao", "crescimento"],
        depth: 2
    },
    {
        text: "Acolher sua dor também é um ato de coragem.",
        category: "cura_emocional",
        element: "Agua",
        moods: ["triste", "cansado"],
        phases: ["florescimento"],
        depth: 3
    },
    {
        text: "Não se apresse. O rio não corre, ele apenas flui.",
        category: "cura_emocional",
        element: "Agua",
        moods: ["ansioso"],
        phases: ["expansao"],
        depth: 1
    },

    // --- Consciência (Ar) ---
    {
        text: "Nem tudo precisa ser resolvido hoje. Algumas respostas amadurecem no silêncio.",
        category: "consciencia",
        element: "Ar",
        moods: ["confuso", "ansioso"],
        phases: ["crescimento"],
        depth: 2
    },
    {
        text: "Observe seus pensamentos como nuvens. Eles passam, o céu da sua mente permanece.",
        category: "consciencia",
        element: "Ar",
        moods: ["ansioso", "focado"],
        phases: ["consciencia_plena"],
        depth: 2
    },

    // --- Ação & Foco (Fogo/Terra) ---
    {
        text: "Um pequeno passo hoje vale mais do que mil intenções adiadas.",
        category: "acao_foco",
        element: "Fogo",
        moods: ["desmotivado", "cansado"],
        phases: ["semente"],
        depth: 1
    },
    {
        text: "Sua estabilidade vem de dentro. Firme suas raízes.",
        category: "acao_foco",
        element: "Terra",
        moods: ["ansioso", "focado"],
        phases: ["crescimento"],
        depth: 2
    },

    // --- Espiritualidade ---
    {
        text: "Existe uma ordem invisível guiando seus caminhos. Confie.",
        category: "espiritualidade",
        element: "Eter",
        moods: ["confuso", "triste"],
        phases: ["semente", "expansao"],
        depth: 3
    },
    {
        text: "O universo respira com você. Você nunca está só.",
        category: "espiritualidade",
        element: "Ar",
        moods: ["solitario"],
        phases: ["florescimento"],
        depth: 2
    }
];

async function main() {
    console.log("🌱 Seeding Oracle Messages...");
    
    // Clear existing? Maybe for dev.
    // await prisma.oracleMessage.deleteMany({});

    for (const msg of MESSAGES) {
        await prisma.oracleMessage.create({
            data: {
                text: msg.text,
                category: msg.category,
                element: msg.element,
                moods: msg.moods,
                phases: msg.phases,
                depth: msg.depth,
                weight: 1.0,
                rarity: "common"
            }
        });
    }

    console.log(`✅ Seeded ${MESSAGES.length} messages.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
