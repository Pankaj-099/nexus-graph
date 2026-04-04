from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.project import Project
from app.models.graph import Node, Edge
from app.schemas.graph import NodeCreate, EdgeCreate, BulkImportData
from app.services.graph.engine import GraphEngine

router = APIRouter(prefix="/v1", tags=["External API v1"])


async def get_api_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate Bearer token for external API"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_project(project_id: int, user_id: int, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ── Projects ────────────────────────────────────────────────────────────────

@router.get("/projects")
async def api_list_projects(
    user: User = Depends(get_api_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.owner_id == user.id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return {
        "data": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "node_count": p.node_count,
                "edge_count": p.edge_count,
                "is_public": p.is_public,
                "created_at": p.created_at,
            }
            for p in projects
        ],
        "total": len(projects),
    }


@router.get("/projects/{project_id}/graph")
async def api_get_graph(
    project_id: int,
    user: User = Depends(get_api_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project(project_id, user.id, db)

    nodes_result = await db.execute(
        select(Node).where(Node.project_id == project_id).limit(1000)
    )
    nodes = nodes_result.scalars().all()

    edges_result = await db.execute(
        select(Edge).where(Edge.project_id == project_id)
    )
    edges = edges_result.scalars().all()

    return {
        "data": {
            "nodes": [
                {
                    "id": n.external_id,
                    "label": n.label,
                    "type": n.node_type,
                    "properties": n.properties,
                    "color": n.color,
                }
                for n in nodes
            ],
            "edges": [
                {
                    "source": next((n.external_id for n in nodes if n.id == e.source_id), None),
                    "target": next((n.external_id for n in nodes if n.id == e.target_id), None),
                    "type": e.relationship_type,
                    "weight": e.weight,
                }
                for e in edges
            ],
        },
        "meta": {
            "node_count": len(nodes),
            "edge_count": len(edges),
        },
    }


@router.post("/projects/{project_id}/nodes")
async def api_add_node(
    project_id: int,
    data: NodeCreate,
    user: User = Depends(get_api_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project(project_id, user.id, db)

    existing = await db.execute(
        select(Node).where(Node.project_id == project_id, Node.external_id == data.external_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Node '{data.external_id}' already exists")

    node = Node(
        project_id=project_id,
        external_id=data.external_id,
        label=data.label,
        node_type=data.node_type,
        properties=data.properties,
        color=data.color,
        size=data.size,
    )
    db.add(node)
    await db.commit()
    await db.refresh(node)

    return {"data": {"id": node.external_id, "label": node.label, "type": node.node_type}, "status": "created"}


@router.post("/projects/{project_id}/edges")
async def api_add_edge(
    project_id: int,
    data: EdgeCreate,
    user: User = Depends(get_api_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project(project_id, user.id, db)

    src = await db.execute(
        select(Node).where(Node.project_id == project_id, Node.external_id == data.source_external_id)
    )
    source = src.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail=f"Source node '{data.source_external_id}' not found")

    tgt = await db.execute(
        select(Node).where(Node.project_id == project_id, Node.external_id == data.target_external_id)
    )
    target = tgt.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail=f"Target node '{data.target_external_id}' not found")

    edge = Edge(
        project_id=project_id,
        source_id=source.id,
        target_id=target.id,
        relationship_type=data.relationship_type,
        label=data.label,
        properties=data.properties,
        weight=data.weight,
        is_directed=data.is_directed,
    )
    db.add(edge)
    await db.commit()

    return {
        "data": {
            "source": data.source_external_id,
            "target": data.target_external_id,
            "type": data.relationship_type,
        },
        "status": "created",
    }


@router.post("/projects/{project_id}/import")
async def api_bulk_import(
    project_id: int,
    data: BulkImportData,
    replace: bool = False,
    user: User = Depends(get_api_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project(project_id, user.id, db)
    result = await GraphEngine.bulk_import(project_id, data, db, replace)
    return {
        "data": {
            "nodes_created": result.nodes_created,
            "edges_created": result.edges_created,
            "nodes_skipped": result.nodes_skipped,
            "edges_skipped": result.edges_skipped,
        },
        "status": "success",
    }


@router.delete("/projects/{project_id}/nodes/{external_id}")
async def api_delete_node(
    project_id: int,
    external_id: str,
    user: User = Depends(get_api_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project(project_id, user.id, db)
    result = await db.execute(
        select(Node).where(Node.project_id == project_id, Node.external_id == external_id)
    )
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    await db.delete(node)
    await db.commit()
    return {"status": "deleted", "id": external_id}
