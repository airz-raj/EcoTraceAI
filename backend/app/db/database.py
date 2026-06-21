"""
EcoTrace AI — Async Database Setup

Uses aiosqlite with connection pooling for non-blocking async queries.
Enables WAL mode for concurrent read/write performance.

AUDIT FIX: Prevents event-loop blocking under high load.
PERF FIX: Connection pool avoids open/close overhead per request.
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import AsyncIterator

import aiosqlite

from app.constants import DB_POOL_SIZE

logger = logging.getLogger("ecotrace.db")

DB_PATH = os.environ.get("ECOTRACE_DB_PATH", "./ecotrace.db")
SCHEMA_PATH = Path(__file__).parent / "schema.sql"

# ─── Connection Pool ──────────────────────────────────────────

_pool: asyncio.Queue[aiosqlite.Connection] = asyncio.Queue(maxsize=DB_POOL_SIZE)
_pool_initialized = False


async def _create_connection() -> aiosqlite.Connection:
    """Create a new database connection with optimized settings."""
    conn = await aiosqlite.connect(DB_PATH)
    conn.row_factory = aiosqlite.Row
    # Enable WAL mode for concurrent read performance
    await conn.execute("PRAGMA journal_mode=WAL")
    # Improve write performance with normal synchronous mode
    await conn.execute("PRAGMA synchronous=NORMAL")
    # Enable foreign keys
    await conn.execute("PRAGMA foreign_keys=ON")
    return conn


async def init_db() -> None:
    """Initialize database schema and pre-warm connection pool."""
    global _pool_initialized

    # Apply schema
    async with aiosqlite.connect(DB_PATH) as db:
        schema = SCHEMA_PATH.read_text()
        await db.executescript(schema)
        await db.commit()
        # Enable WAL mode on the database itself
        await db.execute("PRAGMA journal_mode=WAL")
        logger.info("Database schema applied, WAL mode enabled")

    # Pre-warm the connection pool
    for _ in range(DB_POOL_SIZE):
        conn = await _create_connection()
        await _pool.put(conn)

    _pool_initialized = True
    logger.info("Connection pool initialized with %d connections", DB_POOL_SIZE)


async def get_db() -> AsyncIterator[aiosqlite.Connection]:
    """
    Get an async database connection from the pool.

    Connections are returned to the pool after use, avoiding the
    overhead of opening and closing connections per request.
    """
    if not _pool_initialized or _pool.empty():
        # Fallback: create ad-hoc connection if pool is exhausted
        conn = await _create_connection()
        try:
            yield conn
        finally:
            await conn.close()
        return

    conn = await _pool.get()
    try:
        yield conn
    finally:
        # Return connection to pool instead of closing it
        try:
            await _pool.put(conn)
        except asyncio.QueueFull:
            await conn.close()
