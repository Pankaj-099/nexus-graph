from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_tables
from app.api.routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Relationship Intelligence Platform...")
    await create_tables()
    print("✅ Database tables created/verified")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    description="A powerful platform for exploring and visualizing relationship graphs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Relationship Intelligence Platform API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
