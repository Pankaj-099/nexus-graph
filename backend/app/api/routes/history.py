from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.graph import GraphSnapshot
from app.services.graph.diff import create_snapshot, get_snapshots, compute_diff

router = APIRouter(prefix="/projects/{project_id}/history", tags=["History"])


async def get_project_or_403(project_id: int, user_id: int, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


class SnapshotCreate(BaseModel):
    description: Optional[str] = "Manual snapshot"


@router.get("")
async def list_snapshots(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)
    snapshots = await get_snapshots(project_id, db)
    return [
        {
            "id": s.id,
            "description": s.description,
            "node_count": s.node_count,
            "edge_count": s.edge_count,
            "created_at": s.created_at,
        }
        for s in snapshots
    ]


@router.post("")
async def save_snapshot(
    project_id: int,
    data: SnapshotCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)
    snapshot = await create_snapshot(project_id, data.description or "Manual snapshot", db)
    return {
        "id": snapshot.id,
        "description": snapshot.description,
        "node_count": snapshot.node_count,
        "edge_count": snapshot.edge_count,
        "created_at": snapshot.created_at,
    }


@router.get("/diff")
async def get_diff(
    project_id: int,
    snapshot_a_id: int = Query(...),
    snapshot_b_id: int = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)

    snap_a = await db.get(GraphSnapshot, snapshot_a_id)
    snap_b = await db.get(GraphSnapshot, snapshot_b_id)

    if not snap_a or snap_a.project_id != project_id:
        raise HTTPException(status_code=404, detail="Snapshot A not found")
    if not snap_b or snap_b.project_id != project_id:
        raise HTTPException(status_code=404, detail="Snapshot B not found")

    diff = compute_diff(snap_a.snapshot_data, snap_b.snapshot_data)
    return {
        "snapshot_a": {"id": snap_a.id, "description": snap_a.description, "created_at": snap_a.created_at},
        "snapshot_b": {"id": snap_b.id, "description": snap_b.description, "created_at": snap_b.created_at},
        "diff": diff,
    }


@router.delete("/{snapshot_id}")
async def delete_snapshot(
    project_id: int,
    snapshot_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)
    snapshot = await db.get(GraphSnapshot, snapshot_id)
    if not snapshot or snapshot.project_id != project_id:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    await db.delete(snapshot)
    await db.commit()
    return {"message": "Snapshot deleted"}
