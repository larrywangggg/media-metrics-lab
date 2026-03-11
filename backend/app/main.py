from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routers import router as api_router
from app.core.config import get_cors_origins
from app.core.logging import setup_logging
from app.db.session import engine

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Idempotent schema migration — adds channel column if it doesn't exist yet
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE results ADD COLUMN IF NOT EXISTS channel TEXT"))
        conn.commit()
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
