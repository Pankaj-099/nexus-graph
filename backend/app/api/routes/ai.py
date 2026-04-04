from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.graph import Node, Edge
from app.services.ai.extractor import extract_relationships, natural_language_query, generate_graph_insights
from app.services.graph.engine import GraphEngine
from app.schemas.graph import BulkImportData, NodeCreate, EdgeCreate
import traceback

router = APIRouter(prefix="/projects/{project_id}/ai", tags=["AI"])


async def get_project_or_403(project_id: int, user_id: int, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def get_graph_context(project_id: int, db: AsyncSession) -> dict:
    nodes_result = await db.execute(select(Node).where(Node.project_id == project_id))
    nodes = nodes_result.scalars().all()

    edges_result = await db.execute(select(Edge).where(Edge.project_id == project_id))
    edges = edges_result.scalars().all()

    node_map = {n.id: n for n in nodes}

    return {
        "nodes": [
            {"id": n.id, "external_id": n.external_id, "label": n.label, "node_type": n.node_type}
            for n in nodes
        ],
        "edges": [
            {
                "id": e.id,
                "source_id": e.source_id,
                "target_id": e.target_id,
                "relationship_type": e.relationship_type,
                "source_label": node_map[e.source_id].label if e.source_id in node_map else str(e.source_id),
                "target_label": node_map[e.target_id].label if e.target_id in node_map else str(e.target_id),
            }
            for e in edges
        ],
    }


class ExtractRequest(BaseModel):
    text: str
    auto_import: bool = False
    replace: bool = False


class NLQRequest(BaseModel):
    question: str


@router.post("/extract")
async def extract_from_text(
    project_id: int,
    request: ExtractRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)

    if len(request.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    try:
        result = await extract_relationships(request.text)
    except Exception as e:
        print("❌ FULL ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="AI extraction failed")

    import_result = None
    if request.auto_import and result.get("nodes"):
        nodes = [
            NodeCreate(
                external_id=n.get("id", n.get("label", "").lower().replace(" ", "_")),
                label=n.get("label", ""),
                node_type=n.get("type", "default"),
                properties=n.get("properties", {}),
            )
            for n in result.get("nodes", [])
        ]
        edges = [
            EdgeCreate(
                source_external_id=e.get("source", ""),
                target_external_id=e.get("target", ""),
                relationship_type=e.get("type", "relates_to"),
                properties=e.get("properties", {}),
            )
            for e in result.get("edges", [])
        ]
        data = BulkImportData(nodes=nodes, edges=edges)
        import_result = await GraphEngine.bulk_import(project_id, data, db, request.replace)

    return {
        "extracted": result,
        "import_result": import_result,
        "nodes_found": len(result.get("nodes", [])),
        "edges_found": len(result.get("edges", [])),
    }


@router.post("/query")
async def nlq_query(
    project_id: int,
    request: NLQRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    graph_context = await get_graph_context(project_id, db)

    if not graph_context["nodes"]:
        return {
            "answer": "This graph has no nodes yet. Add some data first.",
            "relevant_nodes": [],
            "relevant_edges": [],
            "confidence": 0,
            "explanation": "Empty graph",
        }

    try:
        result = await natural_language_query(request.question, graph_context)
        return result
    except Exception as e:
        print("❌ FULL ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="AI extraction failed")


@router.get("/insights")
async def get_ai_insights(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await get_project_or_403(project_id, current_user.id, db)
    graph_context = await get_graph_context(project_id, db)

    if not graph_context["nodes"]:
        return {
            "key_insights": ["No data in graph yet"],
            "clusters": [],
            "recommendations": ["Add nodes and edges to get AI insights"],
            "summary": "Empty graph",
        }

    try:
        result = await generate_graph_insights(graph_context)
        return result
    except Exception as e:
        print("❌ FULL ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="AI extraction failed")
