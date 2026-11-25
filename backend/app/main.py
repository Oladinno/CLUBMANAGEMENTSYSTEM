import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api.routes import auth, clubs, memberships, events, students, leadership, admin

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB tables on startup with retry logic for Railway cold starts."""
    max_retries = 10
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created/verified successfully.")
            break
        except Exception as exc:
            logger.warning(f"DB connection attempt {attempt}/{max_retries} failed: {exc}")
            if attempt == max_retries:
                logger.error("Could not connect to database after max retries. Continuing anyway.")
            else:
                time.sleep(3)
    yield
    # Shutdown: nothing to clean up for now

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

import os

# CORS configuration — allow all by default; restrict via ALLOWED_ORIGINS env var in production
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
_cors_origins = _extra_origins if _extra_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(clubs.router, prefix=settings.API_V1_STR)
app.include_router(memberships.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(leadership.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "AUN Club & Student Organization Management System",
        "institution": "American University of Nigeria",
        "status": "online",
        "api_docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
