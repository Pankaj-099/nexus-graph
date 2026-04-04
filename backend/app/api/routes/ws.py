from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.project import Project
from app.websockets.manager import manager
import json

router = APIRouter(tags=["WebSockets"])

async def get_user_from_token(token: str, db: AsyncSession) -> User | None:
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalar_one_or_none()


@router.websocket("/ws/projects/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_from_token(token, db)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Verify project access
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        await websocket.close(code=4003, reason="Project not found")
        return

    await manager.connect(websocket, project_id, user.id)

    # Notify others someone joined
    await manager.broadcast_to_project(
        project_id,
        {
            "type": "user_joined",
            "user": {"id": user.id, "username": user.username},
            "connections": manager.get_connection_count(project_id),
        },
        exclude=websocket,
    )

    # Send welcome message
    await websocket.send_json({
        "type": "connected",
        "message": f"Connected to project {project.name}",
        "connections": manager.get_connection_count(project_id),
    })

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Echo ping
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
        await manager.broadcast_to_project(
            project_id,
            {
                "type": "user_left",
                "user": {"id": user.id, "username": user.username},
                "connections": manager.get_connection_count(project_id),
            },
        )
