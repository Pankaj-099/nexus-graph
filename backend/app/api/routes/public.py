from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.graph import Node, Edge
import secrets

router = APIRouter(tags=["Public"])


@router.get("/public/{share_token}")
async def get_public_graph(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint - no auth required"""
    result = await db.execute(
        select(Project).where(
            Project.share_token == share_token,
            Project.is_public == True
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Graph not found or not public")

    nodes_result = await db.execute(
        select(Node).where(Node.project_id == project.id).limit(500)
    )
    nodes = nodes_result.scalars().all()

    edges_result = await db.execute(
        select(Edge).where(Edge.project_id == project.id)
    )
    edges = edges_result.scalars().all()

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "color": project.color,
            "node_count": project.node_count,
            "edge_count": project.edge_count,
            "created_at": project.created_at,
        },
        "nodes": [
            {
                "id": n.id,
                "external_id": n.external_id,
                "label": n.label,
                "node_type": n.node_type,
                "properties": n.properties,
                "color": n.color,
                "size": n.size,
                "position_x": n.position_x,
                "position_y": n.position_y,
            }
            for n in nodes
        ],
        "edges": [
            {
                "id": e.id,
                "source_id": e.source_id,
                "target_id": e.target_id,
                "relationship_type": e.relationship_type,
                "label": e.label,
                "weight": e.weight,
                "is_directed": e.is_directed,
            }
            for e in edges
        ],
    }


@router.get("/public/{share_token}/embed")
async def get_embed_config(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get embed configuration for iframe"""
    result = await db.execute(
        select(Project).where(
            Project.share_token == share_token,
            Project.is_public == True
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Graph not found")

    return {
        "embed_url": f"/shared/{share_token}",
        "project_name": project.name,
        "node_count": project.node_count,
        "edge_count": project.edge_count,
    }
