import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { CreateRoomModal } from "@/components/vocenna/CreateRoomModal";
import { WaveformEmpty } from "@/components/vocenna/Waveform";
import { Copy, Globe, Lock, Plus, Users, Sparkles } from "@/lib/icons";
import { formatDuration, api, type Room } from "@/lib/vocenna-api";


const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Vocenna" },
      { name: "description", content: "Join, create, and manage live voice collaboration rooms with AI transcription, translation, and memory." },
      { property: "og:title", content: "Dashboard | Vocenna" },
      { property: "og:description", content: "Join, create, and manage live voice collaboration rooms with AI transcription, translation, and memory." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        const list = await api.listRooms();
        setRooms(list);
      } catch (err) {
        console.error("Error fetching active rooms:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  async function handleJoinRoom() {
    if (!code.trim()) return;
    const cleanCode = code.trim();
    try {
      // Navigate straight to the live room page using the room code/identifier
      navigate({ to: "/rooms/$roomId", params: { roomId: cleanCode } });
    } catch (err) {
      console.error("Failed to join room:", err);
    }
  }

  return (
    <AppShell title="Home" onCreateRoom={() => setOpen(true)}>
      <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
        {/* Join Room Code */}
        <section className="rounded-xl border border-hairline bg-ink-raised p-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 bg-ink border border-hairline rounded-lg px-3">
                <Globe size={14} className="text-muted-slate" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  placeholder="Enter Room Code (e.g. room-abc-1234) or UUID"
                  className="flex-1 bg-transparent py-3 font-mono-ui text-sm placeholder:text-muted-slate/80 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowPass((s) => !s)}
                className="mt-2 text-xs text-echo-teal hover:underline"
              >
                Have a passcode?
              </button>
              {showPass && (
                <input
                  placeholder="Passcode"
                  className="mt-2 w-full bg-ink border border-hairline rounded-lg px-3 py-2 font-mono-ui text-sm placeholder:text-muted-slate/70 focus:outline-none focus:border-echo-teal"
                />
              )}
            </div>
            <button
              onClick={handleJoinRoom}
              className="shrink-0 px-6 py-3 rounded-lg border border-echo-teal text-echo-teal font-medium hover:bg-echo-teal/10 transition"
            >
              Join Room
            </button>
          </div>
        </section>

        {/* Active Rooms */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display text-3xl">Active Rooms</h2>
              <p className="text-sm text-muted-slate mt-1">Ongoing sessions across your organization</p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-hairline text-signal-amber hover:bg-ink-raised transition"
            >
              <Plus size={16} strokeWidth={2.5} />
              Create Room
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-hairline bg-ink-raised py-16 flex flex-col items-center justify-center text-muted-slate gap-3">
              <span className="w-8 h-8 border-2 border-echo-teal border-t-transparent rounded-full animate-spin" />
              <span>Loading active sessions...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-xl border border-hairline bg-ink-raised py-16 flex flex-col items-center justify-center text-muted-slate">
              <WaveformEmpty className="w-40 text-echo-teal/60" />
              <p className="mt-3 text-sm">No active rooms.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {rooms.map((r, i) => (
                <motion.div key={r.id} variants={itemVariants}>
                  <RoomCard room={r} highlight={i === 0} />
                </motion.div>
              ))}
              <motion.button
                variants={itemVariants}
                onClick={() => setOpen(true)}
                className="rounded-xl border border-dashed border-hairline bg-ink-raised/40 min-h-[160px] flex flex-col items-center justify-center gap-2 text-muted-slate hover:text-echo-teal hover:border-echo-teal transition cursor-pointer"
              >
                <WaveformEmpty className="w-24 text-echo-teal/70" />
                <span className="text-sm">Start a new audio session</span>
              </motion.button>
            </motion.div>
          )}
        </section>
      </div>

      <CreateRoomModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(r) => setRooms((prev) => [r, ...prev])}
      />
    </AppShell>
  );
}

function RoomCard({ room, highlight }: { room: Room; highlight?: boolean }) {
  return (
    <Link
      to="/rooms/$roomId"
      params={{ roomId: room.id }}
      className={`block rounded-xl bg-ink-raised p-4 border transition hover:border-signal-amber ${
        highlight ? "border-signal-amber" : "border-hairline"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {room.ownerAvatar ? (
              <img src={room.ownerAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center text-xs">
                {room.owner.split(" ").map((n) => n[0]).join("")}
              </div>
            )}
            {room.live && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-mono-ui text-[9px] bg-signal-amber text-[#12161C] px-1.5 rounded-sm">
                LIVE
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{room.title}</div>
            <div className="text-xs text-muted-slate truncate">{room.owner}</div>
          </div>
        </div>
        {room.isPrivate ? (
          <Lock size={14} className="text-muted-slate" />
        ) : (
          <Globe size={14} className="text-echo-teal" />
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs bg-echo-teal/15 text-echo-teal font-mono-ui px-2 py-1 rounded">
          <Users size={12} /> {room.participants}
        </span>
        <span className="font-mono-ui text-sm text-muted-slate">{formatDuration(room.durationSec)}</span>
      </div>
    </Link>
  );
}
