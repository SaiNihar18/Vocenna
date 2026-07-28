import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { api, type Room } from "@/lib/vocenna-api";
import { Users, Globe } from "@/lib/icons";

export const Route = createFileRoute("/my-rooms")({
  head: () => ({
    meta: [
      { title: "My Rooms — Vocenna" },
    ],
  }),
  component: MyRoomsPage,
});

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

function MyRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.listRooms();
        setRooms(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppShell title="My Rooms">
      <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="font-display text-3xl text-echo-teal">My Collaborative Rooms</h2>
          <p className="text-sm text-muted-slate mt-1">Rooms you have created or joined recently</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-muted-slate font-mono-ui text-sm animate-pulse">
            Loading your workspaces...
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-12 text-center space-y-3">
            <div className="text-muted-slate text-sm">No active rooms found.</div>
            <p className="text-xs text-muted-slate/85 max-w-sm mx-auto">
              Create a new room from the sidebar to start collaborating with live AI intelligence.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rooms.map((room) => (
              <motion.div key={room.id} variants={itemVariants}>
                <Link
                  to="/rooms/$roomId"
                  params={{ roomId: room.id }}
                  className="block group rounded-xl border border-hairline bg-ink-raised hover:bg-ink-hover transition p-5 space-y-4"
                >
                <div className="flex items-start justify-between">
                  <div className="bg-echo-teal/10 text-echo-teal font-mono-ui text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                    {room.code}
                  </div>
                  {room.live && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-signal-green animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-signal-green absolute" />
                      <span className="font-mono-ui text-[9px] uppercase tracking-wider text-signal-green font-bold pl-2">
                        LIVE
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-lg group-hover:text-echo-teal transition truncate">
                    {room.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-slate">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{room.participants} connected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe size={12} />
                      <span>{room.isPrivate ? "Private" : "Public"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
