-- ============================================================
-- Esquema de base de datos local (SQLite)
-- App de control de uso de contenido de formato corto
-- Todo el tracking vive en el dispositivo (privacidad by design)
-- ============================================================

-- Usuario (perfil local, sin datos personales obligatorios)
CREATE TABLE users (
    id TEXT PRIMARY KEY,               -- UUID generado localmente
    onboarding_completed INTEGER DEFAULT 0, -- 0/1
    time_perception TEXT,              -- respuesta onboarding: "1-2h", etc.
    main_goal TEXT,                    -- objetivo principal seleccionado
    theme TEXT DEFAULT 'system',       -- 'light' | 'dark' | 'system'
    created_at TEXT NOT NULL,          -- ISO 8601
    updated_at TEXT NOT NULL
);

-- Apps controladas por el usuario
CREATE TABLE tracked_apps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_identifier TEXT NOT NULL,      -- package name (Android) o token opaco (iOS)
    display_name TEXT NOT NULL,        -- 'Instagram', 'TikTok', etc.
    platform TEXT NOT NULL,            -- 'android' | 'ios'
    daily_limit_minutes INTEGER NOT NULL,
    weekend_limit_minutes INTEGER,     -- opcional, override fines de semana
    block_duration_minutes INTEGER NOT NULL DEFAULT 120,
    warning_minutes_before INTEGER DEFAULT 5,
    allow_exceptions INTEGER DEFAULT 0, -- 0/1
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Sesiones de uso diario por app (agregado por día, no evento a evento)
CREATE TABLE usage_sessions (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL REFERENCES tracked_apps(id) ON DELETE CASCADE,
    date TEXT NOT NULL,                -- 'YYYY-MM-DD'
    minutes_used REAL NOT NULL DEFAULT 0,
    opens_count INTEGER DEFAULT 0,
    blocked_attempts INTEGER DEFAULT 0, -- intentos tras alcanzar el límite
    limit_reached INTEGER DEFAULT 0,   -- 0/1
    limit_reached_at TEXT,             -- timestamp ISO
    UNIQUE(app_id, date)
);

-- Bloqueos activos e históricos
CREATE TABLE block_events (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL REFERENCES tracked_apps(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    was_respected INTEGER DEFAULT 1,   -- 0 si se detectó bypass/edición manual
    interrupted_at TEXT                -- si el usuario lo canceló manualmente
);

-- Rachas
CREATE TABLE streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_success_date TEXT,
    updated_at TEXT NOT NULL
);

-- Objetivos definidos por el usuario
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                -- 'reduce_percentage' | 'daily_limit' | 'streak_days'
    target_app_id TEXT REFERENCES tracked_apps(id), -- null = global
    target_value REAL NOT NULL,
    current_value REAL DEFAULT 0,
    status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'achieved' | 'failed'
    created_at TEXT NOT NULL,
    achieved_at TEXT
);

-- Check-in diario (estado de ánimo + disparadores)
CREATE TABLE checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    mood TEXT,                         -- 'great' | 'good' | 'neutral' | 'hard' | 'very_hard'
    trigger_reason TEXT,               -- 'boredom' | 'stress' | 'habit' | ...
    UNIQUE(user_id, date)
);

-- Sesiones de "Modo concentración"
CREATE TABLE focus_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    blocked_app_ids TEXT NOT NULL,     -- JSON array de tracked_apps.id
    completed INTEGER DEFAULT 0,
    ended_at TEXT
);

-- Logros desbloqueados (gamificación)
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,     -- 'first_day', 'streak_7', 'recovered_100min', ...
    unlocked_at TEXT NOT NULL,
    UNIQUE(user_id, achievement_key)
);

-- Índices para las consultas más frecuentes (dashboard y estadísticas)
CREATE INDEX idx_usage_sessions_date ON usage_sessions(date);
CREATE INDEX idx_usage_sessions_app_date ON usage_sessions(app_id, date);
CREATE INDEX idx_block_events_app ON block_events(app_id, started_at);
CREATE INDEX idx_checkins_user_date ON checkins(user_id, date);
