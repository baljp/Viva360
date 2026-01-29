// Collection of base elements to generate 5000+ unique messages via combinatorics

const PREFIXES = [
    "Respire fundo.", "Sintonize agora.", "O universo sussurra:", "Escute o silêncio.",
    "Neste portal,", "Sua luz hoje,", "A harmonia busca,", "A cura revela:",
    "Na dança cósmica,", "Seu coração sabe:", "Abra o espaço,", "Flua com a vida:",
    "A semente dorme,", "O despertar urge:", "Na teia da vida,", "Sinta a batida:",
    "O segredo é:", "A verdade brilha:", "Seu dom floresce,", "A jornada mística:",
    "O oráculo diz:", "A paz regressa,", "Sua essência clama:", "A vibrante energia:",
    "Onde há sombra,", "Hoje a estrela,", "A alma recorda:", "O mestre interior:",
    "Neste instante,", "A magia opera:"
];

const CORES = [
    "o amor incondicional é a sua bússola",
    "a gratidão transforma a escassez em abundância",
    "seu ritmo interno está em fase com as galáxias",
    "cada respiração reconecta o seu ser ao todo",
    "a vulnerabilidade é a porta para a força real",
    "o silêncio é a voz mais alta da sua sabedoria",
    "sua presença é o presente que o mundo esperava",
    "a dor é o solo fértil onde a consciência brota",
    "o equilíbrio nasce da aceitação do que é",
    "sua intuição nunca erra o caminho do coração",
    "a beleza reside na imperfeição de ser humano",
    "você é um oceano de luz em uma gota de vida",
    "o agora é o único templo onde a paz habita",
    "sua voz tem o poder de curar realidades",
    "o florescer não tem pressa, apenas intenção",
    "a simplicidade é a chave da sofisticação divina",
    "seus ancestrais celebram cada vitória sua",
    "a cura que você busca já mora em suas mãos",
    "o universo conspira no silêncio da sua fé",
    "sua luz interna não depende de chamas externas"
];

const SUFFIXES = [
    "Siga com fé.", "Brilhe hoje.", "Confie no fluxo.", "Paz profunda.",
    "Amo você.", "Luz e amor.", "Assim é.", "Namastê.",
    "Crie o novo.", "Seja a cura.", "Voe alto.", "Enraíze-se.",
    "Permita-se.", "Sinta o agora.", "Abrace a luz.", "Viva o dom.",
    "Seja grato.", "Flua livre.", "Ame sempre.", "Deseje o bem."
];

// Combinatorics Check: 30 * 20 * 20 = 12,000 unique variations

export interface DailyWisdom {
    message: string;
    reward: number;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    color: string;
}

export const getDailyWisdom = (userId: string, karma: number = 0): DailyWisdom => {
    // Deterministic seed based on userId and current date
    const dateStr = new Date().toISOString().split('T')[0];
    const seedStr = userId + dateStr;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    const prefix = PREFIXES[seed % PREFIXES.length];
    const core = CORES[(seed >> 2) % CORES.length];
    const suffix = SUFFIXES[(seed >> 4) % SUFFIXES.length];

    const message = `${prefix} ${core}. ${suffix}`;

    // Predictive Reward Algorithm
    // Uses seed to determine rarity
    const rarityRoll = seed % 100;
    let reward = 50;
    let rarity: DailyWisdom['rarity'] = 'Common';
    let color = 'text-nature-500';

    if (rarityRoll > 95) {
        rarity = 'Legendary';
        reward = 500 + (seed % 500); // 500-1000
        color = 'text-amber-600';
    } else if (rarityRoll > 85) {
        rarity = 'Epic';
        reward = 200 + (seed % 100); // 200-300
        color = 'text-indigo-600';
    } else if (rarityRoll > 70) {
        rarity = 'Rare';
        reward = 100 + (seed % 50); // 100-150
        color = 'text-emerald-600';
    }

    // Adjust reward slightly based on current karma (predictive: help those with less, reward those with more)
    if (karma < 100) reward = Math.floor(reward * 1.5);
    
    return { message, reward, rarity, color };
};

// Keeping original method for backward compatibility if needed, but upgrading it
export const getDailyMessage = (): string => {
    const wisdom = getDailyWisdom('anonymous-' + Date.now());
    return wisdom.message;
};

export const getDailyMetamorphosisInsight = (): string => {
    const insights = [
        "Sua energia vital parece atingir o pico agora.",
        "A fase atual favorece sua introspecção.",
        "Você florece quando está focado.",
        "Sua resiliência aumentou notavelmente.",
        "O silêncio tem sido seu maior aliado."
    ];
    const day = new Date().getDate();
    return insights[day % insights.length];
};
