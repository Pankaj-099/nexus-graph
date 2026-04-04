from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.graph import Node, Edge
from app.schemas.graph import NodeResponse, EdgeResponse
from pydantic import BaseModel
from typing import Optional
from fastapi import HTTPException

router = APIRouter(prefix="/projects/{project_id}/search", tags=["Search"])


class SearchResponse(BaseModel):
    nodes: list[NodeResponse]
    total: int
    query: str


class NodeTypesResponse(BaseModel):
    types: list[str]
    counts: dict[str, int]


async def get_project_or_403(project_id: int, user_id: int, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=SearchResponse)
async def search_nodes(
    project_id: int,
    q: str = Query("", description="Search query"),
    node_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)

    query = select(Node).where(Node.project_id == project_id)

    if q:
        query = query.where(
            Node.label.ilike(f"%{q}%") |
            Node.external_id.ilike(f"%{q}%")
        )

    if node_type:
        query = query.where(Node.node_type == node_type)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    nodes = result.scalars().all()

    return SearchResponse(nodes=list(nodes), total=total, query=q)


@router.get("/types", response_model=NodeTypesResponse)
async def get_node_types(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)

    result = await db.execute(
        select(Node.node_type, func.count(Node.id).label("count"))
        .where(Node.project_id == project_id)
        .group_by(Node.node_type)
        .order_by(func.count(Node.id).desc())
    )
    rows = result.all()

    types = [row[0] for row in rows]
    counts = {row[0]: row[1] for row in rows}

    return NodeTypesResponse(types=types, counts=counts)


@router.get("/neighbors/{node_id}")
async def get_neighbors(
    project_id: int,
    node_id: int,
    depth: int = Query(1, le=3),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)

    visited_nodes = {node_id}
    current_level = {node_id}

    for _ in range(depth):
        if not current_level:
            break
        edges_result = await db.execute(
            select(Edge).where(
                Edge.project_id == project_id,
                (Edge.source_id.in_(current_level)) |
                (Edge.target_id.in_(current_level))
            )
        )
        edges = edges_result.scalars().all()
        next_level = set()
        for edge in edges:
            if edge.source_id not in visited_nodes:
                next_level.add(edge.source_id)
            if edge.target_id not in visited_nodes:
                next_level.add(edge.target_id)
        visited_nodes.update(next_level)
        current_level = next_level

    nodes_result = await db.execute(
        select(Node).where(
            Node.project_id == project_id,
            Node.id.in_(visited_nodes)
        )
    )
    nodes = nodes_result.scalars().all()

    edges_result = await db.execute(
        select(Edge).where(
            Edge.project_id == project_id,
            Edge.source_id.in_(visited_nodes),
            Edge.target_id.in_(visited_nodes),
        )
    )
    edges = edges_result.scalars().all()

    return {
        "nodes": nodes,
        "edges": edges,
        "center_node_id": node_id,
        "depth": depth,
    }
