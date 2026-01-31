export const METAMORPHOSIS_PHRASES: Record<string, { JARDIM: string[], CARD: string[] }> = {
  'Feliz': {
    JARDIM: [
      "A alegria floresce no silêncio.",
      "Luz suave preenche os cantos.",
      "Há um brilho calmo crescendo aqui.",
      "O calor da alma nutre o jardim.",
      "Sinta o pulsar leve da vida."
    ],
    CARD: [
      "Hoje eu transbordei vida.",
      "Minha alegria é sagrada.",
      "Vibrando em luz alta.",
      "O sol nasceu dentro de mim.",
      "Felicidade é minha natureza hoje."
    ]
  },
  'Calmo': {
    JARDIM: [
      "O silêncio é o solo da paz.",
      "Respire o frescor do agora.",
      "As águas internas estão paradas.",
      "A quietude é o adubo da alma.",
      "Deixe a serenidade repousar."
    ],
    CARD: [
      "Respirei e permaneci.",
      "A calma também é força.",
      "Meu silêncio foi meu portal hoje.",
      "Em paz com o agora vivido."
    ]
  },
  'Grato': {
    JARDIM: [
      "A gratidão é a raiz de tudo.",
      "Onde há agradecimento, há vida.",
      "Sinta a abundância invisível.",
      "Cada folha é um motivo para agradecer.",
      "A alma se expande no reconhecimento."
    ],
    CARD: [
      "Agradeço pela jornada de hoje.",
      "Tudo foi dádiva neste dia.",
      "Coração em oração profunda.",
      "Hoje eu fui grato pelo que sou.",
      "A abundância me habitou hoje."
    ]
  },
  'Motivado': {
    JARDIM: [
      "A energia se move por dentro.",
      "Há um impulso pronto para brotar.",
      "A força vital circula sem pressa.",
      "O fogo interno aquece a terra.",
      "Crescimento silencioso e potente."
    ],
    CARD: [
      "Eu fui o movimento hoje.",
      "Minha vontade criou novos mundos.",
      "Coragem em cada passo que dei.",
      "Manifestando meu destino agora.",
      "Inspirado pela visão do futuro."
    ]
  },
  'Cansado': {
    JARDIM: [
      "A terra também precisa descansar.",
      "Honre a pausa das raízes.",
      "O silêncio do solo recupera a luz.",
      "Acolha o recolhimento das flores.",
      "O repouso é a semente do amanhã."
    ],
    CARD: [
      "Descanso foi meu ritual hoje.",
      "Honrei meu silêncio necessário.",
      "Recarregando minha luz interior.",
      "Fiz uma pausa para florescer depois.",
      "Acolhi meu limite com amor."
    ]
  },
  'Ansioso': {
    JARDIM: [
      "Mesmo inquieto, algo aqui permanece inteiro.",
      "Nem toda agitação precisa de resposta.",
      "A terra aceita a chuva forte sem medo.",
      "Respire sob a superfície do vento.",
      "O centro do jardim está sempre em paz."
    ],
    CARD: [
      "Voltei para casa: o agora.",
      "Seguro no fluxo, apesar do vento.",
      "Hoje eu precisei respirar e aterrar.",
      "Um passo por vez foi o suficiente.",
      "Minha alma buscou paz na tormenta."
    ]
  },
  'Triste': {
    JARDIM: [
      "A umidade da alma limpa o solo.",
      "As sombras também fazem parte da luz.",
      "O recolhimento precede a floração.",
      "Sinta o acolhimento da terra úmida.",
      "Há beleza na pausa das cores."
    ],
    CARD: [
      "Acolhi minha sombra neste dia.",
      "Cura através do sentir verdadeiro.",
      "Limpando o terreno para o novo.",
      "Vulnerável, mas escolhi ser forte.",
      "Amanhã o sol volta a brilhar."
    ]
  },
  'Sobrecarregado': {
    JARDIM: [
      "Solte o peso que não pertence ao solo.",
      "Simplifique a vista. Foque na raiz.",
      "A natureza não se apressa, mas tudo faz.",
      "Encontre o vazio fértil entre as folhas.",
      "Leveza é a regra deste espaço."
    ],
    CARD: [
      "Soltei o que não era meu hoje.",
      "Priorizei minha essência vital.",
      "Leveza foi o meu caminho escolhido.",
      "Simplifiquei para poder existir.",
      "Hoje eu me escolhi acima de tudo."
    ]
  }
};

export const MOOD_ELEMENTS = {
    'Feliz': { element: 'Fogo', color: 'text-amber-500', glow: 'bg-amber-400', bg: 'bg-[#fffbeb]', border: 'border-amber-200', aura: 'from-amber-100/30' },
    'Calmo': { element: 'Água', color: 'text-cyan-500', glow: 'bg-cyan-400', bg: 'bg-[#f0f9ff]', border: 'border-cyan-200', aura: 'from-cyan-100/30' },
    'Grato': { element: 'Terra', color: 'text-emerald-500', glow: 'bg-emerald-400', bg: 'bg-[#f0fdf4]', border: 'border-emerald-200', aura: 'from-emerald-100/30' },
    'Motivado': { element: 'Fogo', color: 'text-rose-500', glow: 'bg-rose-400', bg: 'bg-[#fff1f2]', border: 'border-rose-200', aura: 'from-rose-100/30' },
    'Cansado': { element: 'Terra', color: 'text-slate-500', glow: 'bg-slate-400', bg: 'bg-[#f8fafc]', border: 'border-slate-200', aura: 'from-slate-100/30' },
    'Ansioso': { element: 'Ar', color: 'text-indigo-500', glow: 'bg-indigo-400', bg: 'bg-[#eef2ff]', border: 'border-indigo-200', aura: 'from-indigo-100/30' },
    'Triste': { element: 'Água', color: 'text-blue-500', glow: 'bg-blue-400', bg: 'bg-[#eff6ff]', border: 'border-blue-200', aura: 'from-blue-100/30' },
    'Sobrecarregado': { element: 'Ar', color: 'text-violet-500', glow: 'bg-violet-400', bg: 'bg-[#f5f3ff]', border: 'border-violet-200', aura: 'from-violet-100/30' }
};

export const getRandomPhrase = (mood: string, context: 'JARDIM' | 'CARD' = 'CARD') => {
    const entry = METAMORPHOSIS_PHRASES[mood] || METAMORPHOSIS_PHRASES['Calmo'];
    const list = entry[context];
    return list[Math.floor(Math.random() * list.length)];
};

export const getRandomPhrases = (mood: string, context: 'JARDIM' | 'CARD' = 'CARD'): [string, string] => {
    const entry = METAMORPHOSIS_PHRASES[mood] || METAMORPHOSIS_PHRASES['Calmo'];
    const list = [...entry[context]];
    const p1 = list.splice(Math.floor(Math.random() * list.length), 1)[0];
    const p2 = list[Math.floor(Math.random() * list.length)] || p1;
    return [p1, p2];
};
