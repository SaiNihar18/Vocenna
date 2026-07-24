# Vocenna API & Real-Time Protocol Specification

This document provides a comprehensive integration guide for connecting frontends (e.g., Google Stitch, Lovable, React, Next.js) to the Vocenna Backend API.

---

## 🔐 Base Configuration & Authentication

- **Base REST URL:** `http://localhost:8000/api/v1`
- **Base WebSocket URL:** `ws://localhost:8000/ws`
- **OpenAPI / Swagger Specs:** `http://localhost:8000/docs`
- **Authentication Scheme:** Standard HTTP Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 Register User
- **Endpoint:** `POST /api/v1/auth/register`
- **Request Body:**
```json
{
  "email": "user@vocenna.com",
  "password": "Password123!",
  "full_name": "Priya Sharma",
  "preferred_language": "en"
}
```
- **Response (201 Created):**
```json
{
  "id": "e4a7b3c2-1234-4567-89ab-cdef01234567",
  "email": "user@vocenna.com",
  "full_name": "Priya Sharma",
  "preferred_language": "en",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2026-07-24T15:00:00Z",
  "updated_at": "2026-07-24T15:00:00Z"
}
```

### 1.2 Login for Access Token
- **Endpoint:** `POST /api/v1/auth/login` (Content-Type: `application/x-www-form-urlencoded`)
- **Body Params:** `username=user@vocenna.com&password=Password123!`
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "e4a7b3c2-1234-4567-89ab-cdef01234567",
    "email": "user@vocenna.com",
    "full_name": "Priya Sharma",
    "preferred_language": "en"
  }
}
```

---

## 2. Room Management Endpoints (`/api/v1/rooms`)

### 2.1 Create Voice Room
- **Endpoint:** `POST /api/v1/rooms`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "title": "Marketing Strategy Sync",
  "description": "Weekly alignment call",
  "is_private": false,
  "max_participants": 20
}
```
- **Response (201 Created):**
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "title": "Marketing Strategy Sync",
  "description": "Weekly alignment call",
  "room_code": "room-abc-1234",
  "owner_id": "e4a7b3c2-1234-4567-89ab-cdef01234567",
  "is_private": false,
  "is_active": true,
  "max_participants": 20,
  "created_at": "2026-07-24T15:05:00Z"
}
```

### 2.2 Join Voice Room
- **Endpoint:** `POST /api/v1/rooms/{room_id}/join`
- **Request Body (if private):** `{"passcode": "secret123"}`
- **Response (200 OK):**
```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "room_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "user_id": "e4a7b3c2-1234-4567-89ab-cdef01234567",
  "role": "host",
  "is_muted": false,
  "hand_raised": false,
  "is_connected": true,
  "joined_at": "2026-07-24T15:06:00Z"
}
```

---

## 3. Real-Time WebSocket Protocol (`ws://localhost:8000/ws/rooms/{room_id}?token=<JWT>`)

### 3.1 Outbound Frames (Server to Client)
- **`user_joined`:** `{ "event": "user_joined", "user": { "id": "...", "full_name": "..." } }`
- **`room_state`:** `{ "event": "room_state", "participants": [...] }`
- **`chat_message`:** `{ "event": "chat_message", "sender_name": "...", "content": "Hello team!" }`
- **`transcript_segment`:** `{ "event": "transcript_segment", "speaker_name": "...", "text": "..." }`
- **`voice_command_executed`:** `{ "event": "voice_command_executed", "command": { ... } }`

### 3.2 Inbound Frames (Client to Server)
- **Send Text Chat:**
```json
{ "type": "chat_message", "content": "Let's review the budget", "language": "en" }
```
- **Stream Audio Chunk:**
```json
{ "type": "audio_chunk", "audio": "<base64_encoded_pcm_or_wav>", "language": "en" }
```
- **Update Controls:**
```json
{ "type": "room_control", "action": "mute" }
```

---

## 4. AI Intelligence & Memory Endpoints

### 4.1 Generate Meeting Summary
- **Endpoint:** `POST /api/v1/rooms/{room_id}/summary`
- **Response (200 OK):**
```json
{
  "room_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "summary": "The team agreed to finalize the Q3 marketing budget and launch campaign next Monday.",
  "key_decisions": ["Approved $50k allocation for Q3 ad spend."],
  "action_items": [
    { "task": "Prepare slide deck", "assignee": "Priya" }
  ]
}
```

### 4.2 Conversation Memory RAG Search
- **Endpoint:** `POST /api/v1/rooms/{room_id}/memory/query`
- **Request Body:**
```json
{
  "question": "What was decided about the marketing budget?",
  "top_k": 5
}
```
- **Response (200 OK):**
```json
{
  "question": "What was decided about the marketing budget?",
  "answer": "The team decided to cap the Q3 marketing budget at $50k.",
  "sources": [
    { "speaker": "Priya Sharma", "text": "Let's cap the marketing budget at $50k." }
  ]
}
```

### 4.3 Export Meeting Transcript Report
- **Endpoint:** `GET /api/v1/rooms/{room_id}/transcripts/export?format=txt`
- **Response:** Downloadable `.txt` or `.json` file containing full transcript timeline.

---

## 🌐 CORS Configuration
The backend is configured with permissive CORS headers for development:
- `CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:8000"]`
- For production, update `CORS_ORIGINS` in `.env` to include your Google Stitch / Lovable domain.
