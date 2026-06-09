-- EcoTrace AI — Database Schema
-- SQLite with async access via aiosqlite

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    country     TEXT NOT NULL DEFAULT 'IN',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carbon_entries (
    id             TEXT PRIMARY KEY,
    user_id        TEXT REFERENCES users(id),
    date           TEXT NOT NULL,
    total_kg_co2   REAL NOT NULL,
    transport_kg   REAL NOT NULL DEFAULT 0,
    food_kg        REAL NOT NULL DEFAULT 0,
    energy_kg      REAL NOT NULL DEFAULT 0,
    shopping_kg    REAL NOT NULL DEFAULT 0,
    digital_kg     REAL NOT NULL DEFAULT 0,
    raw_data       TEXT,  -- JSON blob of full entry
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parsed_bills (
    id             TEXT PRIMARY KEY,
    user_id        TEXT REFERENCES users(id),
    bill_type      TEXT NOT NULL,  -- 'electricity' or 'receipt'
    kwh_consumed   REAL,
    billing_period TEXT,
    confidence     REAL NOT NULL,
    raw_text       TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS device_footprints (
    id             TEXT PRIMARY KEY,
    user_id        TEXT REFERENCES users(id),
    cpu_model      TEXT NOT NULL,
    avg_cpu_percent REAL NOT NULL,
    ram_total_gb   REAL NOT NULL,
    draw_watts     REAL NOT NULL,
    daily_kwh      REAL NOT NULL,
    monthly_kwh    REAL NOT NULL,
    co2_kg         REAL NOT NULL,
    country        TEXT NOT NULL DEFAULT 'IN',
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON carbon_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_date ON carbon_entries(date);
CREATE INDEX IF NOT EXISTS idx_bills_user ON parsed_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_footprints_user ON device_footprints(user_id);
