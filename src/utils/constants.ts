import { GardenConfig, FilmChapter } from '../types/garden';

export const DEFAULT_CONFIG: GardenConfig = {
  recipientName: 'Shubham',
  optionalAge: '',
  openingSubtitle: 'Dedicated to Shubham on His Special Day',
  openingGreeting:
    'Beyond these wrought-iron gates lies a living twilight sanctuary crafted in your honor, Shubham. Experience a 55-second continuous cinematic journey through glowing spirit blossoms, floating keepsakes, the Lantern Bridge, and the Sacred Ancient Tree celebration—followed by full free exploration.',
  finaleTitle: 'Happy Birthday, Shubham!',
  finaleSubtitle: 'May Your Year Ahead Shine as Brightly as This Starlit Clearing',
  finaleMessage:
    "Dear Brother Shubham — Having you as my brother is one of life's greatest blessings. Just like this lantern-lit sanctuary, your strength, warmth, and laughter bring light to everyone around you. May this new chapter of your life bring bold adventures, deep peace, unforgettable milestones, and every dream your heart holds dear. Happy Birthday, Shubham!",
  atmosphere: 'TWILIGHT',
  reducedEffects: false,
  muted: false,
  musicVolume: 0.8,
  letterboxEnabled: false,
  memories: [
    {
      id: 'mem-1',
      tag: 'Keepsake I • Brotherhood & Grit',
      date: 'Chapter One',
      title: 'Every Footstep Forward',
      body:
        'Shubham, from childhood memories to the milestones you continue to build, your determination inspires everyone in our family. May every gate that opens before you lead to new horizons and lasting joy.',
      author: '— With pride & love from your brother',
      image:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      noteFreq: 523.25
    },
    {
      id: 'mem-2',
      tag: 'Keepsake II • Golden Reflections',
      date: 'Chapter Two',
      title: 'Light Across the Waters',
      body:
        'The best celebrations are made of shared stories, late-night talks, and the unmistakable energy you bring into every room. Here is to countless more evenings filled with brotherhood and laughter.',
      author: '— Warmest birthday wishes',
      image:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
      noteFreq: 659.25
    },
    {
      id: 'mem-3',
      tag: 'Keepsake III • The Sacred Canopy',
      date: 'Chapter Three',
      title: 'Deep Roots, Skyward Branches',
      body:
        'Beneath the ancient tree of the Secret Garden, a hundred lanterns and the stars themselves glow for your birthday. May your dreams rise high and this year become your brightest yet, Shubham!',
      author: '— Happy Birthday, Shubham!',
      image:
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
      noteFreq: 783.99
    }
  ],
  flowerWishes: [
    'May serendipity greet you every morning, Shubham.',
    'Wishing you boundless health, clarity, and creative fire.',
    'May every challenge turn into a stepping stone of triumph.',
    'Here is to new travels, great friendships, and peaceful nights.',
    'May laughter echo in your life through every season.',
    'A golden year for an extraordinary brother — Happy Birthday, Shubham!'
  ]
};

export const TOTAL_FILM_DURATION = 72.0;

export const FILM_CHAPTERS: FilmChapter[] = [
  {
    start: 0,
    end: 7,
    tag: 'Chapter I',
    subtitle: 'For Shubham — the ancient gates part at twilight, welcoming you to a sanctuary crafted in your honor.',
    stage: 'GARDEN_ENTRANCE'
  },
  {
    start: 7,
    end: 15,
    tag: 'Chapter II',
    subtitle: 'Every stone beneath your feet was laid to honor your journey, your patience, and your relentless grit.',
    stage: 'LIVING_GARDEN'
  },
  {
    start: 15,
    end: 22,
    tag: 'Chapter III',
    subtitle: 'Golden spirit blossoms and radiant lanterns flare into light along your path, whispering brotherly blessings.',
    stage: 'LIVING_GARDEN'
  },
  {
    start: 22,
    end: 32,
    tag: 'Chapter IV',
    subtitle: 'Within the Memory Pavilion, our shared stories, late-night talks, and lifelong brotherhood shine like gold.',
    stage: 'MEMORY_PAVILION'
  },
  {
    start: 32,
    end: 42,
    tag: 'Chapter V',
    subtitle: 'Three guardian lanterns ignite across the twilight stream, illuminating the path to the dreams you hold dear.',
    stage: 'LANTERN_BRIDGE'
  },
  {
    start: 42,
    end: 54,
    tag: 'Chapter VI',
    subtitle: 'Beneath the Sacred Ancient Tree, a hundred fairy lights and golden torches ignite across the clearing.',
    stage: 'HIDDEN_CLEARING'
  },
  {
    start: 54,
    end: 64,
    tag: 'Chapter VII',
    subtitle: 'A constellation of stars spells your name across the heavens as waves of glowing sky lanterns take flight.',
    stage: 'BIRTHDAY_FINALE'
  },
  {
    start: 64,
    end: 72.5,
    tag: 'Chapter VIII',
    subtitle: 'Happy Birthday, Shubham! The world is brighter, kinder, and infinitely richer with you in it.',
    stage: 'BIRTHDAY_FINALE'
  }
];

export const ATMOSPHERE_PALETTES = {
  TWILIGHT: {
    name: 'Twilight Sanctuary',
    skyColor: 0x050914,
    fogColor: 0x070d1e,
    fogDensity: 0.013,
    hemiSky: 0x3b5998,
    hemiGround: 0x0b1911,
    dirLight: 0x93c5fd,
    dirIntensity: 0.95,
    glowColor: 'rgba(245, 185, 85, 0.9)'
  },
  MIDNIGHT_AURORA: {
    name: 'Midnight Aurora',
    skyColor: 0x020617,
    fogColor: 0x041f2a,
    fogDensity: 0.014,
    hemiSky: 0x2dd4bf,
    hemiGround: 0x042f2e,
    dirLight: 0xa7f3d0,
    dirIntensity: 0.85,
    glowColor: 'rgba(94, 234, 212, 0.9)'
  },
  SUNSET_REVERIE: {
    name: 'Sunset Reverie',
    skyColor: 0x1f0a1d,
    fogColor: 0x2e0821,
    fogDensity: 0.012,
    hemiSky: 0xf472b6,
    hemiGround: 0x451a03,
    dirLight: 0xfba94c,
    dirIntensity: 1.15,
    glowColor: 'rgba(251, 146, 60, 0.9)'
  },
  ENCHANTED_DAWN: {
    name: 'Enchanted Dawn',
    skyColor: 0x0f172a,
    fogColor: 0x1e293b,
    fogDensity: 0.011,
    hemiSky: 0xfde68a,
    hemiGround: 0x14532d,
    dirLight: 0xfef08a,
    dirIntensity: 1.05,
    glowColor: 'rgba(253, 224, 71, 0.9)'
  }
};
