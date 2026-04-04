from fastapi import WebSocket
from typing import Dict, Set
import json


class ConnectionManager:
    def __init__(self):
        # project_id -> set of websockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # websocket -> user_id
        self.user_map: Dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, project_id: int, user_id: int):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        self.active_connections[project_id].add(websocket)
        self.user_map[websocket] = user_id

    def disconnect(self, websocket: WebSocket, project_id: int):
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
        self.user_map.pop(websocket, None)

    async def broadcast_to_project(self, project_id: int, message: dict, exclude: WebSocket = None):
        """Send message to all connections in a project"""
        if project_id not in self.active_connections:
            return
        dead = set()
        for ws in self.active_connections[project_id]:
            if ws == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active_connections[project_id].discard(ws)
            self.user_map.pop(ws, None)

    def get_connection_count(self, project_id: int) -> int:
        return len(self.active_connections.get(project_id, set()))


manager = ConnectionManager()
