"""
EcoTrace AI — FastAPI Backend

Main application entry point with CORS, CSP headers,
rate limiting middleware, and route registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import carbon, parser, digital
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(
    title="EcoTrace AI API",
    description="Carbon Footprint Awareness Platform — 100% Free, No Paid APIs",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────

import os

# Allow Cloud Run URLs dynamically + local dev
_cors_origins = [
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


# ─── Security Headers Middleware ──────────────────────────

@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add CSP and security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ─── Routes ────────────────────────────────────────────────

app.include_router(carbon.router, prefix="/api", tags=["Carbon"])
app.include_router(parser.router, prefix="/api", tags=["Parser"])
app.include_router(digital.router, prefix="/api", tags=["Digital"])


# ─── Health Check ──────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
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
