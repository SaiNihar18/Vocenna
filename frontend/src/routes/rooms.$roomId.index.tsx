import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy, Globe, Hand, HelpCircle, LogOut, Mic, MicOff, PhoneOff,
  Send, Smile, Sparkles, Users, Zap, X, MessageSquare, AlertCircle,
} from "@/lib/icons";
import { Waveform } from "@/components/vocenna/Waveform";
import {
  formatDuration, api, openRoomSocket,
  type ChatMessage, type Participant, type TranscriptSegment, type Room, currentUser
} from "@/lib/vocenna-api";

export const Route = createFileRoute("/rooms/$roomId/")({
  head: ({ params }) => ({
    meta: [
      { title: `Vocenna — Live Room ${params.roomId}` },
      { name: "description", content: "Live voice room with real-time transcription, translation, and AI-assisted collaboration." },
      { property: "og:title", content: "Vocenna Live Room" },
      { property: "og:description", content: "Live voice room with real-time transcription, translation, and AI-assisted collaboration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LiveRoomPage,
});

function LiveRoomPage() {
  const { roomId } = useParams({ from: "/rooms/$roomId/" });
  const [room, setRoom] = useState<Room | null>(null);
  const [me, setMe] = useState<any>(currentUser);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [muted, setMuted] = useState(true); // Default to muted on join
  const [handRaised, setHandRaised] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showCommand, setShowCommand] = useState(false);
  const [commandText, setCommandText] = useState("");
  const [wsError, setWsError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Fetch room & profile details on load
  useEffect(() => {
    async function loadData() {
      try {
        const [roomData, profileData] = await Promise.all([
          api.getRoom(roomId),
          api.me()
        ]);
        setRoom(roomData);
        setDuration(roomData.durationSec || 0);
        setMe(profileData);
      } catch (err) {
        console.error("Error loading room data:", err);
      }
    }
    loadData();
  }, [roomId]);

  // Timer for room duration
  useEffect(() => {
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 2. Manage WebSocket Connection lifecycle
  useEffect(() => {
    if (!me || !roomId) return;

    const ws = openRoomSocket(roomId);
    if (!ws) {
      setWsError("Unable to establish WebSocket connection.");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established successfully.");
      setWsError("");
      // Join Room formally on backend
      api.joinRoom(roomId).catch(console.error);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const event = msg.event || msg.type;

        if (event === "room_state") {
          // Initialize participants & history
          const parts = (msg.participants || []).map((p: any) => ({
            id: p.id,
            name: p.full_name || p.email || "Participant",
            role: (p.role === "host" ? "Host" : p.role === "speaker" ? "Speaker" : "Listener") as any,
            muted: !!p.is_muted,
            speaking: !p.is_muted,
            handRaised: !!p.hand_raised
          }));
          setParticipants(parts);

          if (msg.history) {
            const hist = msg.history.map((h: any) => ({
              id: h.id,
              speaker: h.speaker_name || "Speaker",
              timestamp: new Date().toLocaleTimeString(),
              original: h.text || "",
              translated: h.translated_text || undefined,
              sentiment: (h.sentiment || "positive") as any
            }));
            setTranscript(hist);
          }
        } else if (event === "user_joined") {
          const newUser = msg.user || {};
          setParticipants((prev) => {
            if (prev.some((p) => p.id === newUser.id)) return prev;
            return [...prev, {
              id: newUser.id,
              name: newUser.full_name || newUser.email || "Joined User",
              role: (newUser.role === "host" ? "Host" : newUser.role === "speaker" ? "Speaker" : "Listener") as any,
              muted: !!newUser.is_muted,
              speaking: !newUser.is_muted,
              handRaised: !!newUser.hand_raised
            }];
          });
        } else if (event === "user_left") {
          setParticipants((prev) => prev.filter((p) => p.id !== msg.user_id));
        } else if (event === "chat_message") {
          setMessages((prev) => [...prev, {
            id: msg.message_id || String(Date.now()),
            author: msg.sender_name || "User",
            time: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: msg.content,
            self: msg.user_id === me.id
          }]);
        } else if (event === "transcript_segment") {
          setTranscript((prev) => [...prev, {
            id: msg.transcript_id || String(Date.now()),
            speaker: msg.speaker_name || "Speaker",
            timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            original: msg.text,
            translated: msg.translated_text || undefined,
            sentiment: (msg.sentiment || "positive") as any
          }]);
        } else if (event === "participant_control_updated") {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === msg.user_id
                ? { ...p, muted: !!msg.is_muted, speaking: !msg.is_muted, handRaised: !!msg.hand_raised }
                : p
            )
          );
          if (msg.user_id === me.id) {
            setMuted(!!msg.is_muted);
            setHandRaised(!!msg.hand_raised);
          }
        } else if (event === "voice_command_executed") {
          const cmd = msg.command || {};
          const matchedIntent = cmd.intent ? cmd.intent.toUpperCase() : "COMMAND";
          setCommandText(`${matchedIntent}: ${cmd.response || cmd.parameters?.task_details || "Processed successfully"}`);
          setShowCommand(true);
          setTimeout(() => setShowCommand(false), 6000);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      ws.close();
      stopAudioCapture();
    };
  }, [me, roomId]);

  // 3. Audio Streaming capturing functions
  async function startAudioCapture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(",")[1];
            if (base64Data) {
              wsRef.current?.send(JSON.stringify({
                type: "audio_chunk",
                data: base64Data,
                language: me?.language || "en"
              }));
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start();
      // Cycle recording every 3 seconds to send manageable speech fragments
      audioIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, 3000);

    } catch (err) {
      console.warn("Microphone access denied or error starting recorder:", err);
    }
  }

  function stopAudioCapture() {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  // Handle Mute Button Trigger
  function handleToggleMute() {
    const nextMute = !muted;
    setMuted(nextMute);

    // Send control command
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "room_control",
        action: nextMute ? "mute" : "unmute"
      }));
    }

    if (nextMute) {
      stopAudioCapture();
    } else {
      startAudioCapture();
    }
  }

  // Handle Hand Raised Button Trigger
  function handleToggleHand() {
    const nextHand = !handRaised;
    setHandRaised(nextHand);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "room_control",
        action: nextHand ? "raise_hand" : "lower_hand"
      }));
    }
  }

  // Send Text Chat Message
  function sendMessage() {
    if (!draft.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat_message",
        content: draft.trim(),
        language: me?.language || "en"
      }));
    } else {
      // Fallback local update if WebSocket is offline
      setMessages((m) => [...m, {
        id: `m_${Date.now()}`, author: "You", time: "now", text: draft.trim(), self: true,
      }]);
    }
    setDraft("");
  }

  const activeRoom = room || { title: "Vocenna Room", code: roomId };

  return (
    <div className="min-h-screen flex flex-col bg-ink text-paper">
      {/* Minimal topbar */}
      <header className="h-14 border-b border-hairline flex items-center justify-between px-6 bg-ink">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/vocenna-logo.svg" alt="Vocenna" className="w-6 h-6" />
            <span className="font-display text-lg text-paper tracking-tight">Vocenna</span>
          </Link>
          <span className="hidden md:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-signal-amber">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-pulse" />
              LIVE
            </span>
            <span className="text-muted-slate">|</span>
            <span>{activeRoom.title}</span>
            <span className="ml-3 inline-flex items-center gap-1 font-mono-ui bg-ink-raised px-2 py-0.5 rounded border border-hairline">
              {formatDuration(duration)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/rooms/$roomId/summary"
            params={{ roomId }}
            className="text-xs text-muted-slate hover:text-paper flex items-center gap-1"
          >
            <Sparkles size={14} /> View Summary
          </Link>
          <button className="text-muted-slate hover:text-paper"><Users size={16} /></button>
          <button className="text-muted-slate hover:text-paper relative">
            <MessageSquare size={16} />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-signal-amber" />
          </button>
        </div>
      </header>

      {wsError && (
        <div className="bg-flag-rose/25 text-flag-rose border-b border-flag-rose/30 px-6 py-2 text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{wsError} (Real-time features might be limited)</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-0">
        {/* Stage + transcript */}
        <div className="p-6 flex flex-col gap-4 min-h-0 overflow-auto pb-32">
          <section className="rounded-xl border border-hairline bg-ink-raised p-5">
            <div className="text-xs text-muted-slate mb-4 inline-flex items-center gap-1.5">
              <span className="inline-block w-1 h-3 bg-echo-teal rounded" /> Stage
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence initial={false}>
                {participants.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-muted-slate text-sm">
                    Waiting for participants to join...
                  </div>
                ) : (
                  participants.map((p) => (
                    <ParticipantTile key={p.id} p={p} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="rounded-xl border border-hairline bg-ink-raised p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-paper/85">
                <span className="font-mono-ui text-xs">CC</span> Live Transcript
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono-ui px-2 py-1 rounded border border-echo-teal/40 text-echo-teal">
                  Auto-Detect: {me?.language?.toUpperCase() || "EN"}
                </span>
                <span className="text-[11px] font-mono-ui px-2 py-1 rounded border border-echo-teal/40 text-echo-teal">
                  Translating: Live
                </span>
              </div>
            </div>
            {transcript.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-slate">
                No transcripts recorded yet. Unmute your microphone and start speaking!
              </div>
            ) : (
              <ul className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                  {transcript.map((s) => (
                    <motion.li
                      key={s.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="grid grid-cols-[80px_1fr_auto] gap-3"
                    >
                      <span className="font-mono-ui text-xs text-muted-slate pt-1">{s.timestamp}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-signal-amber" />
                          <span className="text-sm text-paper/90">{s.speaker}</span>
                        </div>
                        <p className="font-mono-ui text-sm leading-relaxed">{s.original}</p>
                        {s.translated && (
                          <p className="mt-1 text-sm italic text-muted-slate flex gap-2 items-start">
                            <Globe size={12} className="mt-1 shrink-0" />
                            <span>{s.translated}</span>
                          </p>
                        )}
                      </div>
                      <SentimentBadge kind={s.sentiment} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </div>

        {/* Chat sidebar */}
        <aside className="border-l border-hairline bg-ink flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare size={14} /> Room Chat
            </div>
            <button className="text-muted-slate hover:text-paper" aria-label="Collapse">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-slate">
                No messages yet. Send a message to start chatting.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 text-[11px] text-muted-slate mb-1">
                    <span>{m.self ? "You" : m.author}</span>
                    <span className="font-mono-ui">{m.time}</span>
                  </div>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.self ? "bg-ink-raised" : "bg-ink-raised border border-hairline"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-hairline p-3 space-y-2">
            <div className="flex items-center gap-1 text-[11px] text-muted-slate">
              <Globe size={10} /> <span className="font-mono-ui">{me?.language?.toUpperCase() || "EN"}</span>
            </div>
            <div className="flex items-center gap-2 bg-ink-raised rounded-lg border border-hairline px-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 bg-transparent py-2.5 text-sm placeholder:text-muted-slate/70 focus:outline-none"
              />
              <button onClick={sendMessage} className="text-echo-teal hover:brightness-125" aria-label="Send">
                <Send size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Voice control toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 bg-ink-raised border border-hairline rounded-full px-3 py-2 shadow-2xl">
          <ToolbarBtn onClick={() => {}} aria-label="Toggle camera">
            <MicOff size={16} className="opacity-40" />
          </ToolbarBtn>
          <button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              muted ? "bg-flag-rose/20 text-flag-rose" : "bg-signal-amber text-[#12161C]"
            }`}
            aria-label="Toggle microphone"
          >
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <ToolbarBtn
            onClick={handleToggleHand}
            aria-label="Raise hand"
            active={handRaised}
          >
            <Hand size={16} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => navigator.clipboard?.writeText(activeRoom.code)} aria-label="Copy room code">
            <Copy size={16} />
          </ToolbarBtn>
          <Link
            to="/"
            className="ml-1 flex items-center gap-2 rounded-full bg-flag-rose/15 text-flag-rose px-4 py-2.5 text-sm hover:bg-flag-rose/25 transition"
          >
            <PhoneOff size={14} /> End Meeting
          </Link>
        </div>
      </div>

      {/* Voice command banner */}
      <AnimatePresence>
        {showCommand && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 bg-ink-raised border border-hairline rounded-lg pl-0 pr-4 py-3 shadow-2xl overflow-hidden">
              <div className="w-1 self-stretch bg-signal-amber" />
              <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center">
                <Zap size={16} className="text-signal-amber" />
              </div>
              <div className="pr-4">
                <div className="font-mono-ui text-[10px] tracking-widest uppercase text-muted-slate">
                  Voice Command Executed
                </div>
                <div className="font-mono-ui text-sm text-paper mt-0.5 uppercase">
                  {commandText}
                </div>
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-echo-teal" />
                <span className="w-1.5 h-1.5 rounded-full bg-echo-teal/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-echo-teal/30" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParticipantTile({ p }: { p: Participant }) {
  const initials = p.name.split(" ").map((n) => n[0]).join("");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative rounded-xl overflow-hidden bg-ink border border-hairline aspect-[16/10] ${
        p.speaking ? "speaking-ring" : ""
      }`}
    >
      {p.avatar ? (
        <img src={p.avatar} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised flex items-center justify-center font-mono-ui text-lg">
            {initials}
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-sm text-paper">{p.name}</span>
          {p.muted ? (
            <span className="w-7 h-7 rounded-full bg-flag-rose/20 text-flag-rose flex items-center justify-center">
              <MicOff size={12} />
            </span>
          ) : (
            <span className="w-7 h-7 rounded-full bg-signal-amber text-[#12161C] flex items-center justify-center">
              <Mic size={12} />
            </span>
          )}
        </div>
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <RoleBadge role={p.role} />
        {p.speaking && <Waveform active className="text-signal-amber" bars={4} />}
      </div>
      {p.handRaised && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-signal-amber text-[#12161C] flex items-center justify-center">
          <Hand size={13} />
        </div>
      )}
    </motion.div>
  );
}

function RoleBadge({ role }: { role: "Host" | "Speaker" | "Listener" }) {
  const styles = {
    Host: "bg-signal-amber/25 text-signal-amber",
    Speaker: "bg-echo-teal/25 text-echo-teal",
    Listener: "bg-muted-slate/20 text-muted-slate",
  } as const;
  return (
    <span className={`font-mono-ui text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${styles[role]}`}>
      {role}
    </span>
  );
}

function SentimentBadge({ kind }: { kind: TranscriptSegment["sentiment"] }) {
  const map = {
    positive: { Icon: Smile, color: "text-echo-teal" },
    confused: { Icon: HelpCircle, color: "text-muted-slate" },
    energetic: { Icon: Zap, color: "text-signal-amber" },
  } as const;
  const { Icon, color } = map[kind];
  return <Icon size={14} className={`${color} mt-1`} />;
}

function ToolbarBtn({
  children, onClick, active, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
        active ? "bg-signal-amber/25 text-signal-amber" : "text-paper/85 hover:bg-ink"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
