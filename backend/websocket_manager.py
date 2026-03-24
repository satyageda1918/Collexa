
import json
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Store connections mapped to user_ids
        self.active_connections: dict[str, WebSocket] = {}
        # Store active attendance sessions: {teacher_id: {subject_id, hour_slot, department, year, section}}
        self.active_sessions: dict[int, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[str(user_id)] = websocket

    def disconnect(self, user_id: str):
        u_id = str(user_id)
        if u_id in self.active_connections:
            del self.active_connections[u_id]

    async def send_personal_message(self, message: str, user_id: str):
        u_id = str(user_id)
        if u_id in self.active_connections:
            await self.active_connections[u_id].send_text(message)

    async def notify_user(self, user_id: int, data: dict):
        """Send a JSON notification to a specific user."""
        u_id = str(user_id)
        if u_id in self.active_connections:
            await self.active_connections[u_id].send_json(data)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

    def start_session(self, teacher_id: int, session_info: dict):
        self.active_sessions[teacher_id] = session_info

    def end_session(self, teacher_id: int):
        if teacher_id in self.active_sessions:
            del self.active_sessions[teacher_id]

    def get_session(self, teacher_id: int):
        return self.active_sessions.get(teacher_id)

# Initialize the global manager
manager = ConnectionManager()
