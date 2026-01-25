
// Collection of 365 Daily Holistic Messages for Viva360

const DAILY_MESSAGES = [
    "Sua energia é o motor deste ecossistema. Receba sua luz diária.",
    "Respire fundo. O universo está em sincronia com seu ritmo.",
    "Hoje é um dia perfeito para cultivar gratidão.",
    "A cura começa quando silenciamos a mente e ouvimos o coração.",
    "Sua presença ilumina o mundo. Brilhe sem medo.",
    "Cada passo consciente é uma vitória sobre o caos.",
    "Nutra suas raízes para que seus galhos toquem o céu.",
    "O equilíbrio não é estático, é um movimento constante.",
    "Você é uma obra de arte em constante evolução.",
    "A paz que você procura já reside dentro de você.",
    "Sintonize a frequência do amor incondicional hoje.",
    "Seus sentimentos são mensageiros sagrados. Escute-os.",
    "A natureza não tem pressa, e mesmo assim tudo realiza.",
    "Confie no fluxo da vida. Você está onde precisa estar.",
    "Sua intuição é a bússola mais precisa que existe.",
    "Hoje, escolha a leveza em cada interação.",
    "Perdoe-se. Você está aprendendo e crescendo.",
    "A beleza da vida mora nos pequenos detalhes.",
    "Conecte-se com a terra. Sinta a estabilidade.",
    "Você é feito de pó de estrelas e sonhos.",
    "Sua voz tem poder. Use-a para criar bondade.",
    "O passado é lição, o futuro é promessa, o agora é presente.",
    "Abra espaço para o novo, soltando o que não serve mais.",
    "Sua vulnerabilidade é sua maior força.",
    "Celebre suas pequenas vitórias hoje.",
    "O universo conspira a favor de quem vibra amor.",
    "Silencie o ruído externo para ouvir sua verdade.",
    "Cada respiração é um recomeço.",
    "Você é o guardião da sua própria energia.",
    "A gratidão transforma o que temos em suficiente.",
    "Hoje, seja gentil com você mesmo.",
    "Sua luz interior não pode ser apagada.",
    "Abrace a incerteza como um campo de infinitas possibilidades.",
    "O amor é a resposta, não importa a pergunta.",
    "Sua jornada é única e sagrada. Honre-a.",
    "Plante sementes de bondade e colha paz.",
    "A harmonia começa de dentro para fora.",
    "Você é um canal de cura e transformação.",
    "Dê permissão a si mesmo para descansar.",
    "A alegria é o estado natural do ser.",
    "Sua mente é um jardim. Que pensamentos você rega?",
    "A coragem não é ausência de medo, é agir com o coração.",
    "Conecte-se com a sabedoria dos seus ancestrais.",
    "O corpo fala. Esteja atento aos seus sinais.",
    "Hoje, pratique o não-julgamento.",
    "Você é digno de todo amor e abundância.",
    "A simplicidade é o último grau de sofisticação.",
    "Flua como a água, adapte-se e contorne obstáculos.",
    "Sua energia atrai sua tribo.",
    "O momento presente é o único lugar onde a vida acontece.",
    // ... (To avoid huge file, we generate variations algorithmically below if exact 365 strings aren't listed)
    // Adding more unique ones to ensure variety before algorithmic filler
    "Acalme seu coração, a resposta virá no silêncio.",
    "Você é um co-criador da sua realidade.",
    "A escuridão apenas realça o brilho da sua luz.",
    "Hoje, ofereça um sorriso genuíno a um estranho.",
    "Seja o amor que você deseja ver no mundo.",
    "A paciência é a chave que abre muitas portas.",
    "Sua autenticidade é seu superpoder.",
    "Renove suas energias em contato com a natureza.",
    "A vida é um espelho do seu mundo interior.",
    "Gratidão é a memória do coração.",
    "Solte o controle e permita que a magia aconteça.",
    "Você é suficiente, exatamente como é.",
    "A cura vem em ondas. Respeite seu fluxo.",
    "Hoje é dia de manifestar seus sonhos mais puros.",
    "Ame suas sombras tanto quanto sua luz.",
    "O universo habita em você.",
    "Sintonize com a abundância que já existe.",
    "Seus limites são sagrados. Respeite-os.",
    "A vida acontece para você, não com você.",
    "Transforme desafios em degraus para sua evolução.",
    "Sua alma conhece o caminho. Confie.",
    "Hoje, faça algo que faça seu coração cantar.",
    "A quietude é onde as grandes ideias nascem.",
    "Você é uma parte essencial do todo.",
    "Libere o peso das expectativas alheias.",
    "Sua presença é um presente para o mundo.",
    "Cultive a paz interior como seu maior tesouro.",
    "A vida é uma dança. Mova-se com graça.",
    "Hoje, observe a beleza ao seu redor.",
    "Você é um farol de esperança.",
    "Receba as bênçãos que estão chegando para você.",
    "Acredite na magia dos novos começos.",
    "Sua energia é magnética.",
    "O amor cura tudo.",
    "Seja leve, seja livre, seja você.",
    "Hoje, pratique a escuta ativa.",
    "Agradeça pelo seu corpo e tudo que ele faz.",
    "Você está seguro e protegido.",
    "A sabedoria está em aceitar o que não pode mudar.",
    "Brilhe sua luz sem pedir desculpas.",
    "A vida é curta demais para não ser feliz.",
    "Sintonize a frequência da alegria.",
    "Você é um milagre vivo.",
    "Hoje, plante intenções positivas.",
    "A natureza cura. Respire ar puro.",
    "Você é amado além da medida.",
    "A quietude fala volumes.",
    "Siga a bússola do seu coração.",
    "A abundância é seu direito de nascença.",
    "Hoje, seja fonte de paz.",
];

// Fallback templates to generate infinite wisdom
const TEMPLATES = [
    "Hoje é um dia para focar em {NOUN}. Deixe a {NOUN} guiar seus passos.",
    "Sintonize com a vibração da {NOUN}. Você é pura {NOUN}.",
    "Receba a benção da {NOUN} neste dia sagrado.",
    "Sua alma pede por {NOUN}. Ouça o chamado.",
    "A chave para hoje é {NOUN}. Pratique com amor.",
    "Cultive {NOUN} em seu coração e veja o mundo mudar.",
    "A {NOUN} é o caminho para a sua evolução hoje."
];

const NOUNS = [
    "Paz", "Luz", "Cura", "Gratidão", "Harmonia", "Serenidade", "Coragem", "Amor", 
    "Esperança", "Sabedoria", "Intuição", "Beleza", "Simplicidade", "Verdade", 
    "Liberdade", "Compaixão", "Empatia", "Vitalidade", "Energia", "Conexão",
    "Natureza", "Essência", "Alma", "Espiritualidade", "Transformação", "Renovação",
    "Criatividade", "Alegria", "Felicidade", "Abundância", "Prosperidade", "Confiança"
];

const METAMORPHOSIS_INSIGHTS = [
    "Notamos que seus momentos de maior gratidão ocorrem após sessões matinais.",
    "Seu padrão de sono melhorou 20% quando você meditou antes de dormir.",
    "Sua energia vital parece atingir o pico às terças-feiras. Aproveite para criar.",
    "Você tende a se sentir mais ansioso aos domingos. Que tal um ritual de aterramento?",
    "Seus registros de gratidão aumentaram sua frequência vibracional.",
    "A fase da lua atual favorece sua introspecção. Respeite seu recolhimento.",
    "Você floresce quando está em contato com a água. Beba mais água hoje.",
    "Sua constelação está vibrando alto. É um bom momento para conexões.",
    "Observe como sua respiração muda quando você está focado.",
    "Seu chakra cardíaco mostra sinais de expansão. Permita-se sentir.",
    "A cor verde tem aparecido muito em sua jornada. Conecte-se com a natureza.",
    "Você está num ciclo de manifestação acelerada. Cuidado com o que pensa.",
    "Sua resiliência aumentou notavelmente no último mês.",
    "Picante na alimentação tem elevado seu fogo interno.",
    "O silêncio tem sido seu maior aliado na cura."
];

export const getDailyMessage = (): string => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Use dayOfYear to deterministic select a message
    if (dayOfYear < DAILY_MESSAGES.length) {
        return DAILY_MESSAGES[dayOfYear];
    }
    
    // Algorithmic fallback for days beyond static list size (if < 365)
    const templateIndex = (dayOfYear * 7) % TEMPLATES.length;
    const nounIndex = (dayOfYear * 13) % NOUNS.length;
    
    return TEMPLATES[templateIndex].replace(/{NOUN}/g, NOUNS[nounIndex]);
};

export const getDailyMetamorphosisInsight = (): string => {
    const today = new Date();
    const dayIndex = today.getDate() + today.getMonth() * 31; // Simple day hash
    return METAMORPHOSIS_INSIGHTS[dayIndex % METAMORPHOSIS_INSIGHTS.length];
};
