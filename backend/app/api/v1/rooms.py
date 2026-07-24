import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.room import VoiceRoom
from app.models.participant import RoomParticipant
from app.schemas.room import (
    RoomCreate,
    RoomUpdate,
    RoomResponse,
    RoomJoinRequest,
    RoomParticipantResponse,
    ParticipantControlRequest,
)
from app.api.deps import get_current_user
from app.utils.code_generator import generate_room_code

router = APIRouter()


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED, summary="Create Voice Room")
async def create_room(
    room_in: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new virtual voice room."""
    # Generate unique room code
    for _ in range(5):
        code = generate_room_code()
        stmt = select(VoiceRoom).where(VoiceRoom.room_code == code)
        if not (await db.execute(stmt)).scalar_one_or_none():
            break

    passcode_hash = get_password_hash(room_in.passcode) if (room_in.is_private and room_in.passcode) else None

    db_room = VoiceRoom(
        title=room_in.title,
        description=room_in.description,
        room_code=code,
        owner_id=current_user.id,
        is_private=room_in.is_private,
        passcode_hash=passcode_hash,
        max_participants=room_in.max_participants,
        is_active=True
    )
    db.add(db_room)
    await db.flush()

    # Automatically add owner as Host participant
    host_participant = RoomParticipant(
        room_id=db_room.id,
        user_id=current_user.id,
        role="host",
        is_muted=False,
        hand_raised=False,
        is_connected=True,
        joined_at=datetime.now(timezone.utc)
    )
    db.add(host_participant)
    await db.commit()

    # Query with loaded relationships
    stmt = (
        select(VoiceRoom)
        .where(VoiceRoom.id == db_room.id)
        .options(
            selectinload(VoiceRoom.owner),
            selectinload(VoiceRoom.participants).selectinload(RoomParticipant.user)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("", response_model=List[RoomResponse], summary="List Public & Active Rooms")
async def list_rooms(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List public voice rooms and rooms the current user owns/participates in."""
    stmt = (
        select(VoiceRoom)
        .where(
            and_(
                VoiceRoom.is_active == True,
                or_(
                    VoiceRoom.is_private == False,
                    VoiceRoom.owner_id == current_user.id
                )
            )
        )
        .options(
            selectinload(VoiceRoom.owner),
            selectinload(VoiceRoom.participants).selectinload(RoomParticipant.user)
        )
        .offset(skip)
        .limit(limit)
        .order_by(VoiceRoom.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{room_identifier}", response_model=RoomResponse, summary="Get Room Details")
async def get_room(
    room_identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get room details by UUID or room_code."""
    try:
        room_uuid = uuid.UUID(room_identifier)
        filter_clause = VoiceRoom.id == room_uuid
    except ValueError:
        filter_clause = VoiceRoom.room_code == room_identifier

    stmt = (
        select(VoiceRoom)
        .where(filter_clause)
        .options(
            selectinload(VoiceRoom.owner),
            selectinload(VoiceRoom.participants).selectinload(RoomParticipant.user)
        )
    )
    result = await db.execute(stmt)
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice room not found"
        )
    return room


@router.post("/{room_id}/join", response_model=RoomParticipantResponse, summary="Join Room")
async def join_room(
    room_id: uuid.UUID,
    join_in: Optional[RoomJoinRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Join a voice room."""
    stmt = select(VoiceRoom).where(VoiceRoom.id == room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()

    if not room or not room.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or inactive"
        )

    # Check passcode for private rooms
    if room.is_private and room.owner_id != current_user.id:
        provided_passcode = join_in.passcode if join_in else None
        if not room.passcode_hash or not provided_passcode or not verify_password(provided_passcode, room.passcode_hash):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or missing passcode for private room"
            )

    # Check existing participant
    stmt_part = select(RoomParticipant).where(
        and_(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == current_user.id
        )
    )
    participant = (await db.execute(stmt_part)).scalar_one_or_none()

    role = "host" if room.owner_id == current_user.id else "speaker"

    if participant:
        participant.is_connected = True
        participant.joined_at = datetime.now(timezone.utc)
        participant.left_at = None
    else:
        participant = RoomParticipant(
            room_id=room_id,
            user_id=current_user.id,
            role=role,
            is_muted=False,
            hand_raised=False,
            is_connected=True,
            joined_at=datetime.now(timezone.utc)
        )
        db.add(participant)

    await db.commit()

    # Load relationship
    stmt_res = (
        select(RoomParticipant)
        .where(RoomParticipant.id == participant.id)
        .options(selectinload(RoomParticipant.user))
    )
    res = await db.execute(stmt_res)
    return res.scalar_one()


@router.post("/{room_id}/leave", summary="Leave Room")
async def leave_room(
    room_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Leave a voice room."""
    stmt = select(RoomParticipant).where(
        and_(
            RoomParticipant.room_id == room_id,
            RoomParticipant.user_id == current_user.id
        )
    )
    participant = (await db.execute(stmt)).scalar_one_or_none()

    if participant:
        participant.is_connected = False
        participant.left_at = datetime.now(timezone.utc)
        await db.commit()

    return {"status": "ok", "message": "Successfully left room"}


@router.put("/{room_id}/controls", response_model=RoomParticipantResponse, summary="Update Controls (Mute/Raise Hand)")
async def update_controls(
    room_id: uuid.UUID,
    control_in: ParticipantControlRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update participant mute status, raise hand status, or role."""
    stmt = (
        select(RoomParticipant)
        .where(
            and_(
                RoomParticipant.room_id == room_id,
                RoomParticipant.user_id == current_user.id
            )
        )
        .options(selectinload(RoomParticipant.user))
    )
    participant = (await db.execute(stmt)).scalar_one_or_none()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant record not found in this room"
        )

    if control_in.is_muted is not None:
        participant.is_muted = control_in.is_muted
    if control_in.hand_raised is not None:
        participant.hand_raised = control_in.hand_raised
    if control_in.role is not None:
        participant.role = control_in.role

    await db.commit()
    await db.refresh(participant)
    return participant


@router.delete("/{room_id}", summary="Delete/Close Room")
async def delete_room(
    room_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a room (Owner/Host only)."""
    stmt = select(VoiceRoom).where(VoiceRoom.id == room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only room host can close/delete room")

    room.is_active = False
    await db.commit()
    return {"status": "ok", "message": "Room closed successfully"}
