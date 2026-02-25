import type { AppToast } from '../../src/contexts/AppToastContext';

export type TimeLapseFlowBridge = {
  go: (state: string) => void;
};

export type TimeLapseEntry = {
  timestamp: string;
  date?: string;
  photoThumb: string;
  image?: string;
  mood?: string;
  quote?: string;
  [key: string]: unknown;
};

export type GardenSnap = {
  date: string;
  image: string;
};

export type TimeLapseModal = 'share_video' | null;

export type TimeLapseToast = AppToast;
