export const METAMORPHOSIS_PHRASES: Record<string, string[]> = {
  'Feliz': [
    "Minha alegria é sagrada.",
    "Vibrando em luz alta.",
    "O sol nasce dentro de mim.",
    "Felicidade é minha natureza.",
    "Hoje eu transbordei vida."
  ],
  'Calmo': [
    "Respirei e permaneci.",
    "A calma também é força.",
    "Meu silêncio é portal.",
    "Em paz com o agora.",
    "Nada perturba meu centro."
  ],
  'Grato': [
    "Agradeço pela jornada.",
    "Tudo é dádiva.",
    "Coração em oração.",
    "Grato pelo que sou.",
    "A abundância me habita."
  ],
  'Motivado': [
    "Eu sou o movimento.",
    "Minha vontade cria mundos.",
    "Coragem em cada passo.",
    "Manifestando meu destino.",
    "Inspirado pela visão."
  ],
  'Cansado': [
    "Descanso é ritual.",
    "Honro meu silêncio.",
    "Recarregando minha luz.",
    "Pausa para florescer.",
    "Acolho meu limite."
  ],
  'Ansioso': [
    "Volto para casa: o agora.",
    "Seguro no fluxo da vida.",
    "Respiro e aterro.",
    "Um passo por vez.",
    "Minha alma está em paz."
  ],
  'Triste': [
    "Acolho minha sombra.",
    "Cura através do sentir.",
    "Limpando o terreno.",
    "Vulnerável e forte.",
    "Amanhã o sol volta."
  ],
  'Sobrecarregado': [
    "Solto o que não é meu.",
    "Priorizo minha essência.",
    "Leveza é o caminho.",
    "Simplifico para existir.",
    "Hoje eu me escolhi."
  ]
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

export const getRandomPhrase = (mood: string) => {
    const list = METAMORPHOSIS_PHRASES[mood] || METAMORPHOSIS_PHRASES['Calmo'];
    return list[Math.floor(Math.random() * list.length)];
};
