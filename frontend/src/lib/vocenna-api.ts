function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://vocenna.onrender.com";
  }
  return "http://localhost:8000";
}

const resolvedBaseUrl = getApiUrl().replace(/\/$/, "");
export const API_BASE = `${resolvedBaseUrl}/api/v1`;
export const WS_BASE = `${resolvedBaseUrl.replace(/^http/, "ws")}/ws/rooms`;

const TOKEN_KEY = "vocenna_jwt";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(t: string) {
  if (typeof window !== "undefined") {
    if (t) {
      window.localStorage.setItem(TOKEN_KEY, t);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }
}

async function req<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      // Clear expired/invalid token to trigger re-auth
      setToken("");
      throw new Error("unauthorized");
    }

    if (!res.ok) {
      throw new Error(String(res.status));
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err.message === "unauthorized") {
      throw err;
    }
    if (fallback !== undefined) return fallback;
    throw new Error("network");
  }
}

// ————— Types
export type Role = "Host" | "Speaker" | "Listener";
export type Participant = {
  id: string;
  name: string;
  avatar?: string;
  role: Role;
  muted: boolean;
  speaking: boolean;
  handRaised: boolean;
};

export type Room = {
  id: string;
  code: string;
  title: string;
  owner: string;
  ownerAvatar?: string;
  isPrivate: boolean;
  participants: number;
  capacity: number;
  durationSec: number;
  live: boolean;
};

export type TranscriptSegment = {
  id: string;
  speaker: string;
  timestamp: string;
  original: string;
  translated?: string;
  sentiment: "positive" | "confused" | "energetic";
};

export type ChatMessage = {
  id: string;
  author: string;
  time: string;
  text: string;
  self: boolean;
};

// ————— Mock fallbacks
export const currentUser = {
  id: "u_member",
  name: "Workspace Member",
  email: "member@vocenna.app",
  avatar: undefined,
  role: "Host" as Role,
  language: "en",
};

export const mockRooms: Room[] = [];

export const mockSummary = {
  headline: "Voice Session Intelligence Report",
  paragraphs: [
    "No transcription segments recorded for this meeting. Please ensure participants speak in the room to index and construct AI summary reports."
  ],
  takeaways: [],
  topics: [],
  key_decisions: [],
  action_items: [],
};

export const mockSentiment = {
  constructive: 0,
  neutral: 0,
  tense: 0,
  note: "No active conversation audio tracked yet. Sentiment indicators are pending.",
};

export function mockMemoryResponse(q: string) {
  return {
    query: q,
    answer: "No matching transcript segments could be synthesized from your past meetings. Ensure you record and save voice rooms first.",
    citations: [],
  };
}

// Translators between Backend (snake_case) & Frontend (camelCase)
function mapBackendRoomToFrontend(br: any): Room {
  return {
    id: br.id,
    code: br.room_code,
    title: br.title,
    owner: br.owner?.full_name ?? "Host",
    ownerAvatar: undefined,
    isPrivate: !!br.is_private,
    participants: br.participants?.length ?? 0,
    capacity: br.max_participants ?? 50,
    durationSec: br.duration_sec ?? 0,
    live: !!br.is_active,
  };
}

// ————— API Surface linked to Backend
export const api = {
  // Auth Endpoints
  register: (body: any) =>
    req("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        full_name: body.fullName,
        preferred_language: body.preferredLanguage ?? "en",
      }),
    }),

  login: async (body: any) => {
    // OAuth2 uses form urlencoded format
    const formData = new URLSearchParams();
    formData.append("username", body.email);
    formData.append("password", body.password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      throw new Error("Invalid email or password");
    }

    const data = await res.json();
    setToken(data.access_token);
    return data;
  },

  me: async () => {
    try {
      const u = await req<any>("/auth/me");
      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        avatar: undefined,
        role: "Host" as Role,
        language: u.preferred_language || "en",
      };
    } catch {
      return currentUser;
    }
  },

  // Rooms Endpoints
  listRooms: async () => {
    try {
      const roomsList = await req<any[]>("/rooms");
      return roomsList.map(mapBackendRoomToFrontend);
    } catch {
      return mockRooms;
    }
  },

  getRoom: async (roomId: string) => {
    const r = await req<any>(`/rooms/${roomId}`);
    return mapBackendRoomToFrontend(r);
  },

  createRoom: async (body: any) => {
    const r = await req<any>("/rooms", {
      method: "POST",
      body: JSON.stringify({
        title: body.title,
        description: body.description ?? "",
        is_private: !!body.isPrivate,
        max_participants: body.capacity ?? 120,
        passcode: body.passcode || null,
      }),
    });
    return mapBackendRoomToFrontend(r);
  },

  joinRoom: (roomId: string) =>
    req(`/rooms/${roomId}/join`, { method: "POST" }, { ok: true }),

  // Intelligence & Summaries
  summary: async (roomId: string) => {
    try {
      const raw = await req<any>(`/rooms/${roomId}/summary`, { method: "POST" });
      return {
        headline: raw.room_title || "Meeting Summary",
        paragraphs: raw.summary ? [raw.summary] : ["No summary content generated."],
        takeaways: raw.key_decisions || [],
        topics: raw.topics || [],
        key_decisions: raw.key_decisions || [],
        action_items: (raw.action_items || []).map((a: any, idx: number) => ({
          id: a.id || `a_${idx}`,
          text: a.text || a,
          assignee: a.assignee || "Unassigned",
          done: !!a.done,
        })),
      };
    } catch {
      return mockSummary;
    }
  },

  sentiment: async (roomId: string) => {
    try {
      const raw = await req<any>(`/rooms/${roomId}/sentiment`, { method: "POST" });
      return {
        constructive: raw.constructive ?? 60,
        neutral: raw.neutral ?? 30,
        tense: raw.tense ?? 10,
        note: raw.note ?? `Sentiment is general ${raw.sentiment || "neutral"}.`,
      };
    } catch {
      return mockSentiment;
    }
  },

  // RAG Query
  memoryQuery: async (roomId: string, q: string) => {
    try {
      const raw = await req<any>(`/rooms/${roomId}/memory/query`, {
        method: "POST",
        body: JSON.stringify({ query: q }),
      });
      return {
        query: q,
        answer: raw.answer || "No response matching query.",
        citations: (raw.citations || []).map((c: any, idx: number) => ({
          id: c.id || `cite_${idx}`,
          quote: c.quote || c.text || "",
          speaker: c.speaker_name || c.speaker || "Participant",
          location: c.timestamp || "Live Session",
          confidence: c.confidence_score !== undefined ? Math.ceil(c.confidence_score * 3) : 3,
        })),
      };
    } catch {
      return mockMemoryResponse(q);
    }
  },
};

export function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ————— WebSocket helper (best-effort; caller handles fallback)
export function openRoomSocket(roomId: string): WebSocket | null {
  try {
    return new WebSocket(`${WS_BASE}/${roomId}?token=${encodeURIComponent(getToken())}`);
  } catch {
    return null;
  }
}
