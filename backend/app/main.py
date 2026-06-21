"""
EcoTrace AI — FastAPI Backend

Main application entry point with CORS, CSP headers,
GZip compression, structured logging, and route registration.
"""

import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.db.database import init_db
from app.routes import carbon, chat, digital, parser

# ─── Structured Logging ────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ecotrace")


# ─── Lifespan ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize database on startup, cleanup on shutdown."""
    logger.info("Starting EcoTrace AI backend...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    logger.info("Shutting down EcoTrace AI backend")


# ─── Application ───────────────────────────────────────────────

app = FastAPI(
    title="EcoTrace AI API",
    description="Carbon Footprint Awareness Platform — 100% Free, No Paid APIs",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────

# Allow Cloud Run URLs dynamically + local dev
_cors_origins: list[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
]
# Add frontend Cloud Run URL if set
if os.environ.get("FRONTEND_URL"):
    _cors_origins.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.run\.app",  # Allow any Cloud Run service
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# ─── GZip Compression ─────────────────────────────────────────

app.add_middleware(GZipMiddleware, minimum_size=500)

# ─── Security Headers Middleware ──────────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add CSP and security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ─── Response Time Logging Middleware ──────────────────────────

@app.middleware("http")
async def log_response_time(request: Request, call_next):
    """Log request processing time for performance monitoring."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# ─── Cache Control Middleware ──────────────────────────────────

@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    """Add Cache-Control and ETag headers for GET responses."""
    response = await call_next(request)
    if request.method == "GET" and response.status_code == 200:
        # Short cache for API data, longer for static health checks
        if request.url.path == "/api/health":
            response.headers["Cache-Control"] = "public, max-age=30"
        elif request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "private, max-age=5"
    return response


# ─── Routes ────────────────────────────────────────────────────

app.include_router(carbon.router, prefix="/api", tags=["Carbon Data"])
app.include_router(parser.router, prefix="/api", tags=["Parser"])
app.include_router(digital.router, prefix="/api", tags=["Digital Footprint"])
app.include_router(chat.router, prefix="/api", tags=["AI Chatbot"])


# ─── Health Check ──────────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancer probes."""
    return JSONResponse(content={"status": "ok", "service": "ecotrace-ai"})


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": "EcoTrace AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
