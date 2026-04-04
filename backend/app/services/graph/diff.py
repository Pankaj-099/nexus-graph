from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.graph import Node, Edge, GraphSnapshot
from app.models.project import Project
import json


async def create_snapshot(project_id: int, description: str, db: AsyncSession) -> GraphSnapshot:
    """Create a snapshot of current graph state"""

    nodes_result = await db.execute(select(Node).where(Node.project_id == project_id))
    nodes = nodes_result.scalars().all()

    edges_result = await db.execute(select(Edge).where(Edge.project_id == project_id))
    edges = edges_result.scalars().all()

    snapshot_data = {
        "nodes": [
            {
                "id": n.id,
                "external_id": n.external_id,
                "label": n.label,
                "node_type": n.node_type,
                "properties": n.properties,
                "color": n.color,
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
            }
            for e in edges
        ],
    }

    snapshot = GraphSnapshot(
        project_id=project_id,
        snapshot_data=snapshot_data,
        description=description,
        node_count=len(nodes),
        edge_count=len(edges),
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_snapshots(project_id: int, db: AsyncSession) -> list[GraphSnapshot]:
    result = await db.execute(
        select(GraphSnapshot)
        .where(GraphSnapshot.project_id == project_id)
        .order_by(GraphSnapshot.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()


def compute_diff(snapshot_a: dict, snapshot_b: dict) -> dict:
    """Compute diff between two snapshots"""

    nodes_a = {n["external_id"]: n for n in snapshot_a.get("nodes", [])}
    nodes_b = {n["external_id"]: n for n in snapshot_b.get("nodes", [])}

    edges_a = {(e["source_id"], e["target_id"], e["relationship_type"]): e
               for e in snapshot_a.get("edges", [])}
    edges_b = {(e["source_id"], e["target_id"], e["relationship_type"]): e
               for e in snapshot_b.get("edges", [])}

    # Nodes added
    nodes_added = [nodes_b[k] for k in nodes_b if k not in nodes_a]
    # Nodes removed
    nodes_removed = [nodes_a[k] for k in nodes_a if k not in nodes_b]
    # Nodes modified
    nodes_modified = []
    for k in nodes_a:
        if k in nodes_b:
            a, b = nodes_a[k], nodes_b[k]
            if a["label"] != b["label"] or a["node_type"] != b["node_type"] or a["properties"] != b["properties"]:
                nodes_modified.append({"before": a, "after": b})

    # Edges added
    edges_added = [edges_b[k] for k in edges_b if k not in edges_a]
    # Edges removed
    edges_removed = [edges_a[k] for k in edges_a if k not in edges_b]

    return {
        "nodes_added": nodes_added,
        "nodes_removed": nodes_removed,
        "nodes_modified": nodes_modified,
        "edges_added": edges_added,
        "edges_removed": edges_removed,
        "summary": {
            "nodes_added": len(nodes_added),
            "nodes_removed": len(nodes_removed),
            "nodes_modified": len(nodes_modified),
            "edges_added": len(edges_added),
            "edges_removed": len(edges_removed),
            "total_changes": len(nodes_added) + len(nodes_removed) + len(nodes_modified) + len(edges_added) + len(edges_removed),
        },
    }
