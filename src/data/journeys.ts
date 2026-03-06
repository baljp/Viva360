/**
 * MICRO JOURNEYS — Dados de jornadas terapêuticas
 *
 * Fonte de verdade para produção.
 * Para dados de teste/demo ver: src/data/test/journeys.test-data.ts
 * Substituído futuramente por GET /journeys
 */
import { Wind, Sun, Moon, Battery, Heart, Brain, CloudRain, Flame, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MicroJourney {
    id: string;
    title: string;
    category: 'Corpo' | 'Mente' | 'Espírito';
    duration: number; // minutes
    moods: string[];
    description: string;
    icon?: LucideIcon;
    xp: number;
}

export const JOURNEYS: MicroJourney[] = [
    // CORPO
    { id: 'j-c-1', title: 'Respiração 4-7-8', category: 'Corpo', duration: 4, moods: ['ansioso', 'estressado'], description: 'Acalme seu sistema nervoso instantaneamente.', icon: Wind, xp: 10 },
    { id: 'j-c-2', title: 'Escaneamento Corporal', category: 'Corpo', duration: 8, moods: ['tenso', 'cansado'], description: 'Libere a tensão muscular progressivamente.', icon: Battery, xp: 20 },
    { id: 'j-c-3', title: 'Energização Matinal', category: 'Corpo', duration: 5, moods: ['preguiçoso', 'desmotivado'], description: 'Movimentos rápidos para despertar o corpo.', icon: Sun, xp: 15 },
    // MENTE
    { id: 'j-m-1', title: 'Pausa para Clareza', category: 'Mente', duration: 3, moods: ['confuso', 'sobrecarregado'], description: 'Organize seus pensamentos em 3 minutos.', icon: Brain, xp: 10 },
    { id: 'j-m-2', title: 'Foco Profundo', category: 'Mente', duration: 10, moods: ['disperso'], description: 'Técnica Pomodoro guiada com binaural beats.', icon: Zap, xp: 30 },
    { id: 'j-m-3', title: 'Diário da Gratidão', category: 'Mente', duration: 5, moods: ['triste', 'negativo'], description: 'Escreva 3 coisas boas do dia.', icon: Heart, xp: 15 },
    // ESPÍRITO
    { id: 'j-e-1', title: 'Conexão com a Essência', category: 'Espírito', duration: 7, moods: ['perdido', 'sozinho'], description: 'Reconecte-se com seu propósito maior.', icon: Moon, xp: 25 },
    { id: 'j-e-2', title: 'Meditação da Compaixão', category: 'Espírito', duration: 12, moods: ['raiva', 'julgar'], description: 'Envie amor para si e para o mundo.', icon: CloudRain, xp: 40 },
    { id: 'j-e-3', title: 'Visualização Criativa', category: 'Espírito', duration: 6, moods: ['apático'], description: 'Visualize seus sonhos se realizando.', icon: Flame, xp: 20 },
];

/** @deprecated Use JOURNEYS. Alias para compatibilidade durante migração. */
export const MOCK_JOURNEYS = JOURNEYS;
export type { MicroJourney as MicroJourneyType };
