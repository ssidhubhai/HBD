export type GardenStage =
  | 'INVITATION'
  | 'GARDEN_ENTRANCE'
  | 'LIVING_GARDEN'
  | 'MEMORY_PAVILION'
  | 'LANTERN_BRIDGE'
  | 'HIDDEN_CLEARING'
  | 'BIRTHDAY_FINALE'
  | 'EPILOGUE';

export type CameraMode = 'FILM_55S' | 'AERIAL_DRONE' | 'FREE_ROAM' | 'ALTAR_ORBIT';

export type LightingAtmosphere = 'TWILIGHT' | 'MIDNIGHT_AURORA' | 'SUNSET_REVERIE' | 'ENCHANTED_DAWN';

export interface MemoryKeepsake {
  id: string;
  tag: string;
  date: string;
  title: string;
  body: string;
  author: string;
  image: string;
  noteFreq: number;
}

export interface GardenConfig {
  recipientName: string;
  optionalAge: string;
  openingSubtitle: string;
  openingGreeting: string;
  finaleTitle: string;
  finaleSubtitle: string;
  finaleMessage: string;
  atmosphere: LightingAtmosphere;
  reducedEffects: boolean;
  muted: boolean;
  musicVolume: number;
  letterboxEnabled: boolean;
  memories: MemoryKeepsake[];
  flowerWishes: string[];
}

export interface FilmChapter {
  start: number;
  end: number;
  tag: string;
  subtitle: string;
  stage: GardenStage;
}
