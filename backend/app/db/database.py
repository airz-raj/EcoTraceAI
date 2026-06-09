"""
EcoTrace AI — Async Database Setup

Uses aiosqlite for non-blocking async queries.
AUDIT FIX: Prevents event-loop blocking under high load.
"""

import aiosqlite
import os
from pathlib import Path

DB_PATH = os.environ.get("ECOTRACE_DB_PATH", "./ecotrace.db")
SCHEMA_PATH = Path(__file__).parent / "schema.sql"


async def init_db():
    """Initialize database with schema if not exists."""
    async with aiosqlite.connect(DB_PATH) as db:
        schema = SCHEMA_PATH.read_text()
        await db.executescript(schema)
        await db.commit()


async def get_db():
    """Get an async database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
