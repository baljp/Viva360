import React from 'react';
import { Activity, Battery, CloudRain, Coffee, Frown, Heart, Sun, Wind, Zap, Droplets, Mountain } from 'lucide-react';

export const METAMORPHOSIS_MOODS = [
  { id: 'Feliz', icon: Sun, element: 'Fogo' },
  { id: 'Calmo', icon: Coffee, element: 'Água' },
  { id: 'Grato', icon: Heart, element: 'Terra' },
  { id: 'Motivado', icon: Zap, element: 'Fogo' },
  { id: 'Cansado', icon: Battery, element: 'Terra' },
  { id: 'Ansioso', icon: CloudRain, element: 'Ar' },
  { id: 'Triste', icon: Frown, element: 'Água' },
  { id: 'Sobrecarregado', icon: Activity, element: 'Ar' },
] as const;

export const ELEMENT_ICONS = {
  Fogo: <Zap size={14} className="text-rose-500" />,
  Água: <Droplets size={14} className="text-cyan-500" />,
  Terra: <Mountain size={14} className="text-emerald-500" />,
  Ar: <Wind size={14} className="text-indigo-500" />,
} as const;
