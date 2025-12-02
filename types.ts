// src/types.ts

// --- Hunter Classes ---
export enum HunterClass {
  NONE = 'None',
  FIGHTER = 'Fighter',
  MAGE = 'Mage',
  ASSASSIN = 'Assassin',
  TANK = 'Tank',
  HEALER = 'Healer',
  NECROMANCER = 'Necromancer',
  SHADOW_MONARCH = 'Shadow Monarch',
}

// --- Rank System ---
export enum Rank {
  E = 'E-Rank',
  D = 'D-Rank',
  C = 'C-Rank',
  B = 'B-Rank',
  A = 'A-Rank',
  S = 'S-Rank',
  NATIONAL = 'National Level',
}

// --- Character Stats ---
export interface Stats {
  strength: number;
  agility: number;
  sense: number;
  vitality: number;
  intelligence: number;
  availablePoints: number;
}

// --- Daily Quest Progress ---
export interface DailyProgress {
  pushups: number;
  situps: number;
  squats: number;
  running: number;
  completed: boolean;
  penaltySurvived?: boolean;
  date: string;
}

// --- Allowed equipment slots ---
export type EquipmentSlot =
  | 'weapon'
  | 'armor'
  | 'cloak'
  | 'gloves'
  | 'boots'
  | 'necklace'
  | 'ring1'
  | 'ring2'
  | 'rune';

// --- Equipment mapping ---
export interface Equipment {
  weapon: number | null;
  armor: number | null;
  cloak: number | null;
  gloves: number | null;
  boots: number | null;
  necklace: number | null;
  ring1: number | null;
  ring2: number | null;
  rune: number | null;
}

// --- User Model ---
export interface User {
  email: string;
  username: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  job: HunterClass;
  rank: Rank;
  title: string;
  gold: number;
  stats: Stats;
  streak: number;
  history: DailyProgress[];

  // FIXED: use exact equipment definition, NOT Record<>
  equipment: Equipment;
}

// --- Initial Values ---
export const INITIAL_USER: User = {
  email: '',
  username: '',
  level: 1,
  currentXp: 0,
  requiredXp: 100,
  job: HunterClass.NONE,
  rank: Rank.E,
  title: 'The Weakest',
  gold: 0,

  stats: {
    strength: 10,
    agility: 10,
    sense: 10,
    vitality: 10,
    intelligence: 10,
    availablePoints: 0,
  },

  streak: 0,
  history: [],

  equipment: {
    weapon: null,
    armor: null,
    cloak: null,
    gloves: null,
    boots: null,
    necklace: null,
    ring1: null,
    ring2: null,
    rune: null,
  },
};

// --- Daily Quest Targets ---
export const DAILY_GOALS = {
  pushups: 100,
  situps: 100,
  squats: 100,
  running: 10,
};
