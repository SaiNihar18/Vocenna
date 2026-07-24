# Vocenna Frontend Boilerplate & Skeleton Guide

This guide provides clean, production-ready React + TypeScript code skeletons and integration hooks connecting all UI Cards directly to the Vocenna FastAPI REST endpoints and real-time WebSockets.

---

## 📁 1. TypeScript Types (`src/types/vocenna.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  preferred_language: string;
  is_active: bool;
  created_at: string;
}

export interface VoiceRoom {
  id: string;
  title: string;
  description?: string;
  room_code: string;
  owner_id: string;
  is_private: boolean;
  is_active: boolean;
  max_participants: number;
  created_at: string;
  owner?: User;
  participants: RoomParticipant[];
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: "host" | "speaker" | "listener";
  is_muted: boolean;
  hand_raised: boolean;
  is_connected: boolean;
  joined_at: string;
  user?: User;
}

export interface ChatMessage {
  id?: string;
  user_id: string;
  sender_name: string;
  content: string;
  original_language: string;
  timestamp: string;
}

export interface TranscriptSegment {
  transcript_id?: string;
  user_id: string;
  speaker_name: string;
  text: string;
  language: string;
  timestamp: string;
  sentiment?: "positive" | "confused" | "energetic" | "neutral";
}

export interface AISummaryResponse {
  room_id: string;
  room_title: string;
  summary: string;
  key_decisions: string[];
  action_items: { task: string; assignee: string }[];
}

export interface RAGQueryResponse {
  question: string;
  answer: string;
  sources: { speaker: string; text: string; transcript_id: string }[];
}
```

---

## ⚡ 2. API HTTP Client (`src/lib/api.ts`)

```typescript
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vocenna_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authAPI = {
  register: (data: any) => api.post("/auth/register", data),
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    const res = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    localStorage.setItem("vocenna_token", res.data.access_token);
    return res.data;
  },
  getMe: () => api.get("/auth/me")
};

// Room Services
export const roomAPI = {
  createRoom: (data: { title: string; description?: string; is_private?: boolean; passcode?: string }) =>
    api.post("/rooms", data),
  listRooms: () => api.get("/rooms"),
  getRoomDetails: (idOrCode: string) => api.get(`/rooms/${idOrCode}`),
  joinRoom: (roomId: string, passcode?: string) => api.post(`/rooms/${roomId}/join`, { passcode }),
  leaveRoom: (roomId: string) => api.post(`/rooms/${roomId}/leave`),
  updateControls: (roomId: string, controls: { is_muted?: boolean; hand_raised?: boolean }) =>
    api.put(`/rooms/${roomId}/controls`, controls)
};

// Intelligence & RAG Services
export const intelligenceAPI = {
  getSummary: (roomId: string) => api.post(`/rooms/${roomId}/summary`),
  queryRAGMemory: (roomId: string, question: string) =>
    api.post(`/rooms/${roomId}/memory/query`, { question, top_k: 5 }),
  exportTranscript: (roomId: string, format: "txt" | "json" = "txt") =>
    api.get(`/rooms/${roomId}/transcripts/export?format=${format}`, { responseType: "blob" })
};
```

---

## 📡 3. Real-Time WebSocket Hook (`src/hooks/useVocennaWS.ts`)

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage, TranscriptSegment, RoomParticipant } from "../types/vocenna";

export function useVocennaWS(roomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("vocenna_token");
    if (!roomId || !token) return;

    const wsUrl = `ws://localhost:8000/ws/rooms/${roomId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case "room_state":
          setParticipants(data.participants);
          break;
        case "user_joined":
          setParticipants((prev) => [...prev.filter((p) => p.user_id !== data.user.id), data.user]);
          break;
        case "chat_message":
          setMessages((prev) => [...prev, data]);
          break;
        case "transcript_segment":
          setTranscripts((prev) => [...prev, data]);
          break;
        case "voice_command_executed":
          setLastVoiceCommand(data.command);
          break;
        case "participant_control_updated":
          setParticipants((prev) =>
            prev.map((p) =>
              p.user_id === data.user_id
                ? { ...p, is_muted: data.is_muted, hand_raised: data.hand_raised }
                : p
            )
          );
          break;
        case "user_left":
          setParticipants((prev) => prev.filter((p) => p.user_id !== data.user_id));
          break;
      }
    };

    ws.onclose = () => setIsConnected(false);
    return () => ws.close();
  }, [roomId]);

  const sendChatMessage = useCallback((content: string, language: string = "en") => {
    socketRef.current?.send(JSON.stringify({ type: "chat_message", content, language }));
  }, []);

  const sendRoomControl = useCallback((action: "mute" | "unmute" | "raise_hand" | "lower_hand") => {
    socketRef.current?.send(JSON.stringify({ type: "room_control", action }));
  }, []);

  const streamAudioChunk = useCallback((base64Audio: string, language: string = "en") => {
    socketRef.current?.send(JSON.stringify({ type: "audio_chunk", audio: base64Audio, language }));
  }, []);

  return {
    isConnected,
    participants,
    messages,
    transcripts,
    lastVoiceCommand,
    sendChatMessage,
    sendRoomControl,
    streamAudioChunk
  };
}
```

---

## 🎨 4. Card Component Skeletons

### 💳 `CreateRoomCard.tsx`
```tsx
import React, { useState } from "react";
import { roomAPI } from "../../lib/api";

export const CreateRoomCard = ({ onRoomCreated }: { onRoomCreated: (room: any) => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await roomAPI.createRoom({ title, description, is_private: isPrivate, passcode });
    onRoomCreated(res.data);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">Create Voice Room</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl"
          placeholder="Room Title (e.g. Marketing Sync)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl"
          placeholder="Room Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-5 h-5"
          />
          <span>Private Room (Requires Passcode)</span>
        </div>
        {isPrivate && (
          <input
            type="password"
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl"
            placeholder="Room Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
        )}
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-semibold">
          Create Room
        </button>
      </form>
    </div>
  );
};
```

---

### 💳 `LiveTranscriptCard.tsx`
```tsx
import React from "react";
import { TranscriptSegment } from "../../types/vocenna";

export const LiveTranscriptCard = ({ transcripts }: { transcripts: TranscriptSegment[] }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl h-96 overflow-y-auto">
      <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
        <span>🎙️</span> Live Subtitles & Transcripts
      </h4>
      <div className="space-y-3">
        {transcripts.map((t, idx) => (
          <div key={idx} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
              <span className="font-semibold text-cyan-300">{t.speaker_name}</span>
              <span className="uppercase px-2 py-0.5 bg-slate-700 rounded text-[10px]">{t.language}</span>
            </div>
            <p className="text-sm text-slate-100">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 💳 `AskPastMeetingsCard.tsx` (RAG Search Widget)
```tsx
import React, { useState } from "react";
import { intelligenceAPI } from "../../lib/api";
import { RAGQueryResponse } from "../../types/vocenna";

export const AskPastMeetingsCard = ({ roomId }: { roomId: string }) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGQueryResponse | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    try {
      const res = await intelligenceAPI.queryRAGMemory(roomId, question);
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-indigo-500/30 text-white shadow-2xl">
      <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-3">
        <span>🔍</span> Ask Conversation Memory (RAG)
      </h3>
      <form onSubmit={handleAsk} className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-slate-900/80 border border-indigo-500/40 p-3 rounded-xl text-sm"
          placeholder="e.g. What was decided about the budget?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-semibold">
          {loading ? "Searching..." : "Ask AI"}
        </button>
      </form>

      {result && (
        <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/20 space-y-3">
          <p className="text-sm font-medium text-slate-200">{result.answer}</p>
          {result.sources.length > 0 && (
            <div className="text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-indigo-300">Sources:</span>
              {result.sources.map((s, idx) => (
                <div key={idx} className="bg-slate-800 p-2 rounded border border-slate-700">
                  "{s.text}" — <span className="text-indigo-400">{s.speaker}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```
