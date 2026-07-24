import json
from typing import Dict, List, Optional, Any
from fastapi import WebSocket


class RoomConnectionManager:
    def __init__(self):
        # Mapping: room_id -> { user_id: { "websocket": WebSocket, "user_data": dict } }
        self.rooms: Dict[str, Dict[str, Dict[str, Any]]] = {}

    async def connect(self, room_id: str, user_id: str, websocket: WebSocket, user_data: dict):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        
        self.rooms[room_id][user_id] = {
            "websocket": websocket,
            "user_data": user_data
        }

    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.rooms:
            if user_id in self.rooms[room_id]:
                del self.rooms[room_id][user_id]
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def send_personal_message(self, room_id: str, user_id: str, message: dict):
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            websocket = self.rooms[room_id][user_id]["websocket"]
            await websocket.send_text(json.dumps(message))

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user_id: Optional[str] = None):
        if room_id not in self.rooms:
            return
        
        disconnected_users = []
        payload = json.dumps(message)

        for user_id, connection in self.rooms[room_id].items():
            if exclude_user_id and user_id == exclude_user_id:
                continue
            try:
                await connection["websocket"].send_text(payload)
            except Exception:
                disconnected_users.append(user_id)

        # Cleanup failed connections
        for user_id in disconnected_users:
            self.disconnect(room_id, user_id)

    def get_room_active_users(self, room_id: str) -> List[dict]:
        if room_id not in self.rooms:
            return []
        return [conn["user_data"] for conn in self.rooms[room_id].values()]


# Global Connection Manager instance
manager = RoomConnectionManager()
