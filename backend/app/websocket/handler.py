import json
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.db import AsyncSessionLocal
from app.models.room import VoiceRoom
from app.models.participant import RoomParticipant
from app.models.message import ChatMessage
from app.websocket.connection_manager import manager
from app.websocket.auth import get_ws_user

router = APIRouter()


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: Optional[str] = Query(None)
):
    """Real-time room WebSocket endpoint handling audio streaming, chat, and room controls."""
    # 1. Authenticate user
    user = await get_ws_user(websocket, token)
    if not user:
        return

    try:
        room_uuid = uuid.UUID(room_id)
    except ValueError:
        await websocket.close(code=4000, reason="Invalid room UUID format")
        return

    str_room_id = str(room_uuid)
    str_user_id = str(user.id)

    async with AsyncSessionLocal() as db:
        # 2. Check room existence
        stmt_room = select(VoiceRoom).where(VoiceRoom.id == room_uuid)
        room = (await db.execute(stmt_room)).scalar_one_or_none()
        if not room or not room.is_active:
            await websocket.close(code=4004, reason="Room not found or inactive")
            return

        # 3. Ensure participant record exists or update connection state
        stmt_part = select(RoomParticipant).where(
            and_(
                RoomParticipant.room_id == room_uuid,
                RoomParticipant.user_id == user.id
            )
        )
        participant = (await db.execute(stmt_part)).scalar_one_or_none()

        if not participant:
            role = "host" if room.owner_id == user.id else "speaker"
            participant = RoomParticipant(
                room_id=room_uuid,
                user_id=user.id,
                role=role,
                is_muted=False,
                hand_raised=False,
                is_connected=True,
                joined_at=datetime.now(timezone.utc)
            )
            db.add(participant)
        else:
            participant.is_connected = True
            participant.left_at = None

        await db.commit()
        await db.refresh(participant)

        user_data = {
            "id": str_user_id,
            "email": user.email,
            "full_name": user.full_name,
            "preferred_language": user.preferred_language,
            "role": participant.role,
            "is_muted": participant.is_muted,
            "hand_raised": participant.hand_raised
        }

    # 4. Connect to connection manager
    await manager.connect(str_room_id, str_user_id, websocket, user_data)

    # 5. Broadcast user joined event to room
    await manager.broadcast_to_room(
        str_room_id,
        {
            "event": "user_joined",
            "user": user_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        exclude_user_id=str_user_id
    )

    # 6. Send initial room state to joining user
    active_participants = manager.get_room_active_users(str_room_id)
    await manager.send_personal_message(
        str_room_id,
        str_user_id,
        {
            "event": "room_state",
            "room_id": str_room_id,
            "room_title": room.title,
            "participants": active_participants,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

    # 7. Listen for incoming WebSocket messages
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_json = json.loads(data)
            except json.JSONDecodeError:
                await manager.send_personal_message(str_room_id, str_user_id, {
                    "event": "error",
                    "message": "Invalid JSON format"
                })
                continue

            event_type = message_json.get("type") or message_json.get("event")

            if event_type == "ping":
                await manager.send_personal_message(str_room_id, str_user_id, {"event": "pong"})

            elif event_type == "chat_message":
                content = message_json.get("content", "").strip()
                language = message_json.get("language", user.preferred_language)

                if content:
                    async with AsyncSessionLocal() as db:
                        chat_msg = ChatMessage(
                            room_id=room_uuid,
                            user_id=user.id,
                            content=content,
                            original_language=language,
                            translations={}
                        )
                        db.add(chat_msg)
                        await db.commit()
                        await db.refresh(chat_msg)
                        msg_id = str(chat_msg.id)
                        created_at = chat_msg.created_at.isoformat()

                    await manager.broadcast_to_room(
                        str_room_id,
                        {
                            "event": "chat_message",
                            "message_id": msg_id,
                            "user_id": str_user_id,
                            "sender_name": user.full_name or user.email,
                            "content": content,
                            "original_language": language,
                            "timestamp": created_at
                        }
                    )

            elif event_type == "room_control":
                action = message_json.get("action")  # mute, unmute, raise_hand, lower_hand
                target_user_id = message_json.get("target_user_id", str_user_id)

                async with AsyncSessionLocal() as db:
                    target_uuid = uuid.UUID(target_user_id)
                    stmt_p = select(RoomParticipant).where(
                        and_(
                            RoomParticipant.room_id == room_uuid,
                            RoomParticipant.user_id == target_uuid
                        )
                    )
                    target_part = (await db.execute(stmt_p)).scalar_one_or_none()

                    if target_part:
                        if action == "mute":
                            target_part.is_muted = True
                        elif action == "unmute":
                            target_part.is_muted = False
                        elif action == "raise_hand":
                            target_part.hand_raised = True
                        elif action == "lower_hand":
                            target_part.hand_raised = False

                        await db.commit()
                        await db.refresh(target_part)

                        # Update connection manager memory cache
                        if target_user_id in manager.rooms.get(str_room_id, {}):
                            manager.rooms[str_room_id][target_user_id]["user_data"]["is_muted"] = target_part.is_muted
                            manager.rooms[str_room_id][target_user_id]["user_data"]["hand_raised"] = target_part.hand_raised

                        await manager.broadcast_to_room(
                            str_room_id,
                            {
                                "event": "participant_control_updated",
                                "user_id": target_user_id,
                                "action": action,
                                "is_muted": target_part.is_muted,
                                "hand_raised": target_part.hand_raised,
                                "updated_by": str_user_id,
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            }
                        )

    except WebSocketDisconnect:
        manager.disconnect(str_room_id, str_user_id)
        async with AsyncSessionLocal() as db:
            stmt_p = select(RoomParticipant).where(
                and_(
                    RoomParticipant.room_id == room_uuid,
                    RoomParticipant.user_id == user.id
                )
            )
            part = (await db.execute(stmt_p)).scalar_one_or_none()
            if part:
                part.is_connected = False
                part.left_at = datetime.now(timezone.utc)
                await db.commit()

        await manager.broadcast_to_room(
            str_room_id,
            {
                "event": "user_left",
                "user_id": str_user_id,
                "user_name": user.full_name or user.email,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
