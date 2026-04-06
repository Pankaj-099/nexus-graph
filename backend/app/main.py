from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_tables

from app.models.user import User  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.graph import Node, Edge, SchemaDefinition, GraphSnapshot, ActivityLog  # noqa: F401

from app.api.routes import (
    auth, projects, graph, search,
    ai, analytics, history, ws,
    activity, public, external_api
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Relationship Intelligence Platform...")
    await create_tables()
    print("✅ Database tables created/verified")
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    description="""
## Relationship Intelligence Platform API

### Authentication
Use `Bearer <token>` from `/api/auth/login` for all protected endpoints.

### External API
Use `/api/v1/` endpoints with your Bearer token to integrate programmatically.

### Public Graphs
Access shared graphs via `/api/public/{share_token}` — no auth required.
    """,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routes
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(search.router, prefix="/api")

# Intelligence
app.include_router(ai.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# History & Real-time
app.include_router(history.router, prefix="/api")
app.include_router(ws.router)

# Phase 6
app.include_router(activity.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(external_api.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Relationship Intelligence Platform API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "external_api": "/api/v1/",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
