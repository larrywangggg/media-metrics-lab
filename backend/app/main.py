from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import router as api_router
from app.core.config import get_cors_origins
from app.core.logging import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run all pending Alembic migrations on startup (idempotent, in subprocess to avoid blocking)
    import subprocess, sys, os
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=os.path.join(os.path.dirname(__file__), ".."),
        check=True,
    )
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,  
    allow_origins=get_cors_origins(), # List of allowed origins from config
    allow_credentials=True, # Allow cookies and credentials
    allow_methods=["*"], # Allow all HTTP methods
    allow_headers=["*"],   # Allow all headers
)

app.include_router(api_router) # Include API routes
