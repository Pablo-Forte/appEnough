// src/database/db.ts
//
// Capa de acceso a datos. Este archivo es el "puente" entre:
//   - database/schema.sql   (el plano de las tablas)
//   - src/models/types.ts   (los tipos que usa el resto de la app)
//
// Aquí se ejecuta el schema una sola vez al arrancar, y se exponen
// funciones simples para leer/escribir datos ya tipados.

import * as SQLite from "expo-sqlite";
import { TrackedApp, UsageSession } from "../models/types";

const db = SQLite.openDatabaseSync("app.db");

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    onboarding_completed INTEGER DEFAULT 0,
    time_perception TEXT,
    main_goal TEXT,
    theme TEXT DEFAULT 'system',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tracked_apps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    app_identifier TEXT NOT NULL,
    display_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    daily_limit_minutes INTEGER NOT NULL,
    weekend_limit_minutes INTEGER,
    block_duration_minutes INTEGER NOT NULL DEFAULT 120,
    warning_minutes_before INTEGER DEFAULT 5,
    allow_exceptions INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_sessions (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    date TEXT NOT NULL,
    minutes_used REAL NOT NULL DEFAULT 0,
    opens_count INTEGER DEFAULT 0,
    blocked_attempts INTEGER DEFAULT 0,
    limit_reached INTEGER DEFAULT 0,
    limit_reached_at TEXT,
    UNIQUE(app_id, date)
);
`;

export function initDatabase(): void {
  db.execSync(SCHEMA_SQL);
}

// ------------------------------------------------------------
// tracked_apps
// ------------------------------------------------------------

export function saveTrackedApp(app: TrackedApp): void {
  db.runSync(
    `INSERT OR REPLACE INTO tracked_apps
     (id, user_id, app_identifier, display_name, platform, daily_limit_minutes,
      weekend_limit_minutes, block_duration_minutes, warning_minutes_before,
      allow_exceptions, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      app.id,
      app.userId,
      app.appIdentifier,
      app.displayName,
      app.platform,
      app.dailyLimitMinutes,
      app.weekendLimitMinutes ?? null,
      app.blockDurationMinutes,
      app.warningMinutesBefore,
      app.allowExceptions ? 1 : 0,
      app.isActive ? 1 : 0,
      app.createdAt,
      app.updatedAt,
    ],
  );
}

export function getTrackedApps(userId: string): TrackedApp[] {
  const rows = db.getAllSync<any>(
    "SELECT * FROM tracked_apps WHERE user_id = ? AND is_active = 1",
    [userId],
  );
  return rows.map(rowToTrackedApp);
}

function rowToTrackedApp(row: any): TrackedApp {
  return {
    id: row.id,
    userId: row.user_id,
    appIdentifier: row.app_identifier,
    displayName: row.display_name,
    platform: row.platform,
    dailyLimitMinutes: row.daily_limit_minutes,
    weekendLimitMinutes: row.weekend_limit_minutes ?? undefined,
    blockDurationMinutes: row.block_duration_minutes,
    warningMinutesBefore: row.warning_minutes_before,
    allowExceptions: !!row.allow_exceptions,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ------------------------------------------------------------
// usage_sessions
// ------------------------------------------------------------

export function upsertUsageSession(session: UsageSession): void {
  db.runSync(
    `INSERT INTO usage_sessions
     (id, app_id, date, minutes_used, opens_count, blocked_attempts, limit_reached, limit_reached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       minutes_used = excluded.minutes_used,
       opens_count = excluded.opens_count,
       blocked_attempts = excluded.blocked_attempts,
       limit_reached = excluded.limit_reached,
       limit_reached_at = excluded.limit_reached_at`,
    [
      session.id,
      session.appId,
      session.date,
      session.minutesUsed,
      session.opensCount,
      session.blockedAttempts,
      session.limitReached ? 1 : 0,
      session.limitReachedAt ?? null,
    ],
  );
}

export function getTodaySession(
  appId: string,
  date: string,
): UsageSession | null {
  const row = db.getFirstSync<any>(
    "SELECT * FROM usage_sessions WHERE app_id = ? AND date = ?",
    [appId, date],
  );
  if (!row) return null;
  return {
    id: row.id,
    appId: row.app_id,
    date: row.date,
    minutesUsed: row.minutes_used,
    opensCount: row.opens_count,
    blockedAttempts: row.blocked_attempts,
    limitReached: !!row.limit_reached,
    limitReachedAt: row.limit_reached_at ?? undefined,
  };
}
