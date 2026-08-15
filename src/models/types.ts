// ============================================================
// Modelos de datos (TypeScript) — espejo de database/schema.sql
// Usar estos tipos en toda la capa de datos/UI de la app.
// ============================================================

export type Platform = 'android' | 'ios';
export type Theme = 'light' | 'dark' | 'system';
export type Mood = 'great' | 'good' | 'neutral' | 'hard' | 'very_hard';
export type TriggerReason =
  | 'boredom'
  | 'stress'
  | 'habit'
  | 'waiting'
  | 'wanted_to_talk'
  | 'unknown'
  | 'other';
export type GoalType = 'reduce_percentage' | 'daily_limit' | 'streak_days';
export type GoalStatus = 'in_progress' | 'achieved' | 'failed';

export interface User {
  id: string;
  onboardingCompleted: boolean;
  timePerception?: string;
  mainGoal?: string;
  theme: Theme;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface TrackedApp {
  id: string;
  userId: string;
  appIdentifier: string; // package name (Android) o token opaco (iOS)
  displayName: string;
  platform: Platform;
  dailyLimitMinutes: number;
  weekendLimitMinutes?: number;
  blockDurationMinutes: number;
  warningMinutesBefore: number;
  allowExceptions: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageSession {
  id: string;
  appId: string;
  date: string; // 'YYYY-MM-DD'
  minutesUsed: number;
  opensCount: number;
  blockedAttempts: number;
  limitReached: boolean;
  limitReachedAt?: string;
}

export interface BlockEvent {
  id: string;
  appId: string;
  startedAt: string;
  endsAt: string;
  durationMinutes: number;
  wasRespected: boolean;
  interruptedAt?: string;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastSuccessDate?: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  targetAppId?: string; // undefined = objetivo global
  targetValue: number;
  currentValue: number;
  status: GoalStatus;
  createdAt: string;
  achievedAt?: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  date: string;
  mood?: Mood;
  triggerReason?: TriggerReason;
}

export interface FocusSession {
  id: string;
  userId: string;
  startedAt: string;
  durationMinutes: number;
  blockedAppIds: string[]; // se serializa como JSON en la columna
  completed: boolean;
  endedAt?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementKey: string;
  unlockedAt: string;
}

// ------------------------------------------------------------
// Tipos derivados / vistas usadas en el dashboard
// (no son tablas, se calculan a partir de las anteriores)
// ------------------------------------------------------------

export interface DailyAppProgress {
  app: TrackedApp;
  minutesUsed: number;
  limitMinutes: number;
  percentUsed: number; // 0-100+
  isBlocked: boolean;
  blockEndsAt?: string;
}

export interface RecoveredTimeSummary {
  currentWeekMinutes: number;
  previousWeekMinutes: number;
  recoveredMinutes: number;
  percentChange: number; // negativo = redujo consumo
}

export interface WeeklyTrendPoint {
  weekLabel: string; // 'Semana 1'
  totalMinutes: number;
}
