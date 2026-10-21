export type Theme = {
  bgFrom: string;
  bgVia: string;
  bgTo: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentInk: string;
  glow1: string;
  glow2: string;
  chipBg: string;
  chipRing: string;
  chipText: string;
  name: string;
};

export const THEMES: Theme[] = [
  {
    name: 'Emerald',
    bgFrom: '#134e4a',
    bgVia: '#0f766e',
    bgTo: '#064e3b',
    accent: '#fcd34d',
    accentStrong: '#f59e0b',
    accentSoft: '#fbbf24',
    accentInk: '#451a03',
    glow1: 'rgba(52,211,153,0.22)',
    glow2: 'rgba(45,212,191,0.12)',
    chipBg: 'rgba(52,211,153,0.22)',
    chipRing: 'rgba(110,231,183,0.35)',
    chipText: '#a7f3d0',
  },
  {
    name: 'Ocean',
    bgFrom: '#0c4a6e',
    bgVia: '#075985',
    bgTo: '#082f49',
    accent: '#38bdf8',
    accentStrong: '#0284c7',
    accentSoft: '#7dd3fc',
    accentInk: '#082f49',
    glow1: 'rgba(56,189,248,0.22)',
    glow2: 'rgba(14,165,233,0.12)',
    chipBg: 'rgba(56,189,248,0.22)',
    chipRing: 'rgba(125,211,252,0.35)',
    chipText: '#bae6fd',
  },
  {
    name: 'Sunset',
    bgFrom: '#7f1d1d',
    bgVia: '#9a3412',
    bgTo: '#431407',
    accent: '#fb923c',
    accentStrong: '#ea580c',
    accentSoft: '#fdba74',
    accentInk: '#431407',
    glow1: 'rgba(251,146,60,0.22)',
    glow2: 'rgba(234,88,12,0.12)',
    chipBg: 'rgba(251,146,60,0.22)',
    chipRing: 'rgba(253,186,116,0.35)',
    chipText: '#fed7aa',
  },
  {
    name: 'Forest',
    bgFrom: '#14532d',
    bgVia: '#166534',
    bgTo: '#052e16',
    accent: '#a3e635',
    accentStrong: '#65a30d',
    accentSoft: '#bef264',
    accentInk: '#1a2e05',
    glow1: 'rgba(163,230,53,0.2)',
    glow2: 'rgba(132,204,22,0.12)',
    chipBg: 'rgba(163,230,53,0.22)',
    chipRing: 'rgba(190,242,100,0.35)',
    chipText: '#d9f99d',
  },
  {
    name: 'Night',
    bgFrom: '#1e293b',
    bgVia: '#334155',
    bgTo: '#0f172a',
    accent: '#38bdf8',
    accentStrong: '#0369a1',
    accentSoft: '#7dd3fc',
    accentInk: '#0f172a',
    glow1: 'rgba(56,189,248,0.18)',
    glow2: 'rgba(99,102,241,0.1)',
    chipBg: 'rgba(56,189,248,0.18)',
    chipRing: 'rgba(125,211,252,0.3)',
    chipText: '#bae6fd',
  },
  {
    name: 'Desert',
    bgFrom: '#92400e',
    bgVia: '#b45309',
    bgTo: '#451a03',
    accent: '#fde047',
    accentStrong: '#ca8a04',
    accentSoft: '#fef08a',
    accentInk: '#451a03',
    glow1: 'rgba(253,224,71,0.22)',
    glow2: 'rgba(245,158,11,0.12)',
    chipBg: 'rgba(253,224,71,0.22)',
    chipRing: 'rgba(254,240,138,0.35)',
    chipText: '#fef9c3',
  },
  {
    name: 'Crimson',
    bgFrom: '#4c0519',
    bgVia: '#881337',
    bgTo: '#4c0519',
    accent: '#fb7185',
    accentStrong: '#e11d48',
    accentSoft: '#fda4af',
    accentInk: '#4c0519',
    glow1: 'rgba(251,113,133,0.22)',
    glow2: 'rgba(225,29,72,0.12)',
    chipBg: 'rgba(251,113,133,0.22)',
    chipRing: 'rgba(253,164,175,0.35)',
    chipText: '#fecdd3',
  },
  {
    name: 'Arctic',
    bgFrom: '#0e7490',
    bgVia: '#0891b2',
    bgTo: '#164e63',
    accent: '#67e8f9',
    accentStrong: '#06b6d4',
    accentSoft: '#a5f3fc',
    accentInk: '#083344',
    glow1: 'rgba(103,232,249,0.22)',
    glow2: 'rgba(34,211,238,0.12)',
    chipBg: 'rgba(103,232,249,0.22)',
    chipRing: 'rgba(165,243,252,0.35)',
    chipText: '#cffafe',
  },
  {
    name: 'Sage',
    bgFrom: '#3f3f1f',
    bgVia: '#4d7c0f',
    bgTo: '#1a2e05',
    accent: '#facc15',
    accentStrong: '#a16207',
    accentSoft: '#fde68a',
    accentInk: '#1a2e05',
    glow1: 'rgba(250,204,21,0.18)',
    glow2: 'rgba(132,204,22,0.12)',
    chipBg: 'rgba(250,204,21,0.2)',
    chipRing: 'rgba(253,230,138,0.32)',
    chipText: '#ecfccb',
  },
  {
    name: 'Steel',
    bgFrom: '#1e3a8a',
    bgVia: '#1d4ed8',
    bgTo: '#172554',
    accent: '#60a5fa',
    accentStrong: '#2563eb',
    accentSoft: '#93c5fd',
    accentInk: '#172554',
    glow1: 'rgba(96,165,250,0.22)',
    glow2: 'rgba(59,130,246,0.12)',
    chipBg: 'rgba(96,165,250,0.22)',
    chipRing: 'rgba(147,197,253,0.35)',
    chipText: '#bfdbfe',
  },
];

// Maps seed words to a fitting mood so the background matches the puzzle
// (GARDEN -> green, OCEANS -> blue, VOLCANO -> crimson...). Anything without
// an explicit match falls back to a stable hash pick so colors still vary.
const WORD_THEME: Record<string, string> = {
  GARDEN: 'Forest', CASTLE: 'Steel', PLANET: 'Night', OCEANS: 'Ocean',
  WINDOW: 'Arctic', MASTER: 'Steel', SILVER: 'Arctic', GUITAR: 'Sunset',
  POCKET: 'Sage', FOREST: 'Forest', BRIDGE: 'Steel', SUMMER: 'Desert',
  WINTER: 'Arctic', SPRING: 'Sage', AUTUMN: 'Sunset', ROCKET: 'Night',
  TEMPLE: 'Desert', MARKET: 'Sunset', DRAGON: 'Crimson', KNIGHT: 'Steel',
  PIRATE: 'Ocean', ISLAND: 'Ocean', DESERT: 'Desert', JUNGLE: 'Forest',
  RIVERS: 'Ocean', VALLEY: 'Sage', MEADOW: 'Sage', HARBOR: 'Ocean',
  TUNNEL: 'Night', MARBLE: 'Arctic', VOLCANO: 'Crimson', FLOWER: 'Sage',
  SATURN: 'Night', JUPITER: 'Crimson', WEIGHT: 'Steel', GOLDEN: 'Desert',
  GALAXY: 'Night', BASKET: 'Sage', CANDLE: 'Sunset', DOCTOR: 'Arctic',
  FACTORY: 'Steel', HEALTH: 'Sage', JOURNEY: 'Sunset', LADDER: 'Desert',
  MONSTER: 'Crimson', NUMBERS: 'Steel', ORCHARD: 'Forest', PENGUIN: 'Arctic',
  QUARTZ: 'Arctic', RHYTHM: 'Crimson', TRAVEL: 'Ocean', WIZARD: 'Night',
  ZEBRAS: 'Sage', ANGELS: 'Arctic', BUTTON: 'Sage', CRYSTAL: 'Arctic',
  DOLPHIN: 'Ocean', ENGINE: 'Steel', FEATHER: 'Arctic', GIRAFFE: 'Desert',
  HARMONY: 'Emerald', KINGDOM: 'Steel', LANTERN: 'Sunset', MAGNETS: 'Steel',
  NOODLE: 'Sunset', OCTOPUS: 'Crimson', PUZZLE: 'Emerald', RAINBOW: 'Emerald',
  SHADOW: 'Night', TORNADO: 'Steel', UNICORN: 'Arctic', VORTEX: 'Night',
  WHALES: 'Ocean', CIRCUS: 'Crimson', BUTTER: 'Sunset',
};

function hashTheme(levelId: number): Theme {
  return THEMES[(levelId * 7 + 3) % THEMES.length];
}

export function themeForLevel(levelId: number, seedWord?: string): Theme {
  const byName = seedWord ? THEMES.find((t) => t.name === WORD_THEME[seedWord]) : undefined;
  return byName ?? hashTheme(levelId);
}
