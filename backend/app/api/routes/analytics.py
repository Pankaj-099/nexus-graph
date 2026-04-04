from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.services.analytics.kpi import get_graph_kpis, find_shortest_path

router = APIRouter(prefix="/projects/{project_id}/analytics", tags=["Analytics"])


async def get_project_or_403(project_id: int, user_id: int, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/kpis")
async def get_kpis(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)
    return await get_graph_kpis(project_id, db)


@router.get("/path")
async def shortest_path(
    project_id: int,
    source: str = Query(..., description="Source node external_id"),
    target: str = Query(..., description="Target node external_id"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)
    return await find_shortest_path(project_id, source, target, db)
