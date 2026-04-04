from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from collections import defaultdict, deque
from app.models.graph import Node, Edge
from app.models.project import Project


async def get_graph_kpis(project_id: int, db: AsyncSession) -> dict:
    """Calculate graph KPIs and metrics"""

    # Node count
    node_count = await db.scalar(
        select(func.count(Node.id)).where(Node.project_id == project_id)
    ) or 0

    # Edge count
    edge_count = await db.scalar(
        select(func.count(Edge.id)).where(Edge.project_id == project_id)
    ) or 0

    # Node types distribution
    type_result = await db.execute(
        select(Node.node_type, func.count(Node.id).label("count"))
        .where(Node.project_id == project_id)
        .group_by(Node.node_type)
        .order_by(func.count(Node.id).desc())
    )
    node_types = [{"type": row[0], "count": row[1]} for row in type_result.all()]

    # Relationship types distribution
    rel_result = await db.execute(
        select(Edge.relationship_type, func.count(Edge.id).label("count"))
        .where(Edge.project_id == project_id)
        .group_by(Edge.relationship_type)
        .order_by(func.count(Edge.id).desc())
    )
    rel_types = [{"type": row[0], "count": row[1]} for row in rel_result.all()]

    # Most connected nodes (by degree)
    degree_result = await db.execute(
        text("""
            SELECT n.id, n.label, n.node_type, n.color,
                   COUNT(DISTINCT e1.id) + COUNT(DISTINCT e2.id) as degree
            FROM nodes n
            LEFT JOIN edges e1 ON e1.source_id = n.id AND e1.project_id = :pid
            LEFT JOIN edges e2 ON e2.target_id = n.id AND e2.project_id = :pid
            WHERE n.project_id = :pid
            GROUP BY n.id, n.label, n.node_type, n.color
            ORDER BY degree DESC
            LIMIT 10
        """),
        {"pid": project_id}
    )
    most_connected = [
        {"id": row[0], "label": row[1], "node_type": row[2], "color": row[3], "degree": row[4]}
        for row in degree_result.all()
    ]

    # Orphan nodes (no connections)
    orphan_result = await db.execute(
        text("""
            SELECT COUNT(*) FROM nodes n
            WHERE n.project_id = :pid
            AND n.id NOT IN (
                SELECT DISTINCT source_id FROM edges WHERE project_id = :pid
                UNION
                SELECT DISTINCT target_id FROM edges WHERE project_id = :pid
            )
        """),
        {"pid": project_id}
    )
    orphan_count = orphan_result.scalar() or 0

    # Graph density
    max_edges = node_count * (node_count - 1) if node_count > 1 else 1
    density = round(edge_count / max_edges, 4) if max_edges > 0 else 0

    # Avg connections per node
    avg_degree = round(edge_count * 2 / node_count, 2) if node_count > 0 else 0

    return {
        "node_count": node_count,
        "edge_count": edge_count,
        "orphan_count": orphan_count,
        "density": density,
        "avg_degree": avg_degree,
        "node_types": node_types,
        "relationship_types": rel_types,
        "most_connected": most_connected,
    }


async def find_shortest_path(
    project_id: int,
    source_external_id: str,
    target_external_id: str,
    db: AsyncSession,
) -> dict:
    """BFS shortest path between two nodes"""

    # Get source node
    src_result = await db.execute(
        select(Node).where(
            Node.project_id == project_id,
            Node.external_id == source_external_id
        )
    )
    source = src_result.scalar_one_or_none()
    if not source:
        return {"found": False, "error": f"Source node '{source_external_id}' not found"}

    # Get target node
    tgt_result = await db.execute(
        select(Node).where(
            Node.project_id == project_id,
            Node.external_id == target_external_id
        )
    )
    target = tgt_result.scalar_one_or_none()
    if not target:
        return {"found": False, "error": f"Target node '{target_external_id}' not found"}

    if source.id == target.id:
        return {"found": True, "path_nodes": [source.id], "path_edges": [], "length": 0}

    # Load all edges for this project
    edges_result = await db.execute(
        select(Edge).where(Edge.project_id == project_id)
    )
    all_edges = edges_result.scalars().all()

    # Build adjacency list (bidirectional)
    adj: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for edge in all_edges:
        adj[edge.source_id].append((edge.target_id, edge.id))
        if not edge.is_directed:
            adj[edge.target_id].append((edge.source_id, edge.id))
        else:
            adj[edge.target_id].append((edge.source_id, edge.id))

    # BFS
    queue = deque([(source.id, [source.id], [])])
    visited = {source.id}

    while queue:
        current, path_nodes, path_edges = queue.popleft()

        for neighbor_id, edge_id in adj[current]:
            if neighbor_id == target.id:
                final_nodes = path_nodes + [neighbor_id]
                final_edges = path_edges + [edge_id]

                # Load node details
                nodes_result = await db.execute(
                    select(Node).where(Node.id.in_(final_nodes))
                )
                nodes_map = {n.id: n for n in nodes_result.scalars().all()}

                # Load edge details
                edges_detail_result = await db.execute(
                    select(Edge).where(Edge.id.in_(final_edges))
                )
                edges_map = {e.id: e for e in edges_detail_result.scalars().all()}

                return {
                    "found": True,
                    "length": len(final_nodes) - 1,
                    "path_nodes": [
                        {
                            "id": nid,
                            "label": nodes_map[nid].label if nid in nodes_map else str(nid),
                            "node_type": nodes_map[nid].node_type if nid in nodes_map else "unknown",
                            "color": nodes_map[nid].color if nid in nodes_map else "#6366f1",
                            "external_id": nodes_map[nid].external_id if nid in nodes_map else "",
                        }
                        for nid in final_nodes
                    ],
                    "path_edges": [
                        {
                            "id": eid,
                            "relationship_type": edges_map[eid].relationship_type if eid in edges_map else "relates_to",
                            "source_id": edges_map[eid].source_id if eid in edges_map else 0,
                            "target_id": edges_map[eid].target_id if eid in edges_map else 0,
                        }
                        for eid in final_edges
                    ],
                }

            if neighbor_id not in visited:
                visited.add(neighbor_id)
                queue.append((
                    neighbor_id,
                    path_nodes + [neighbor_id],
                    path_edges + [edge_id],
                ))

    return {"found": False, "error": "No path exists between these nodes"}
