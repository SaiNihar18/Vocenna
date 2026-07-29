import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { Play, Pause, Calendar, Clock, Download, X, Volume2, AlertCircle } from "@/lib/icons";

export const Route = createFileRoute("/recordings")({
  head: () => ({
    meta: [
      { title: "Recordings | Vocenna" },
    ],
  }),
  component: RecordingsPage,
});

const initialRecordings = [
  {
    id: "rec_1",
    title: "Q3 Strategy Alignment Meeting",
    roomCode: "VOC-9921-X",
    date: "2026-07-28",
    duration: "45:21",
    size: "41.5 MB",
    transcript: "[Elena R. - 10:00 AM]: Welcome everyone to the Q3 Alignment session. Today we are prioritizing audio latency issues...\n[Marcus V. - 10:04 AM]: I strongly believe we need a Redis cache layer to solve the bottleneck.\n[Sarah J. - 10:15 AM]: Let's halt the vocal tuning module until core playback latency is under 12ms."
  },
  {
    id: "rec_2",
    title: "Cross-Border API Review",
    roomCode: "VOC-3212-A",
    date: "2026-07-24",
    duration: "18:40",
    size: "17.1 MB",
    transcript: "[Host - 2:00 PM]: Let's walk through the cors updates for Vercel integration.\n[Marcus V. - 2:05 PM]: Make sure vocenna.vercel.app and vocenna-ecru are both in the origins array."
  },
  {
    id: "rec_3",
    title: "Weekly Engineering Sync",
    roomCode: "VOC-4410-B",
    date: "2026-07-20",
    duration: "32:15",
    size: "29.4 MB",
    transcript: "[Host - 9:00 AM]: Good morning team. Today we are testing the new SQLAlchemy asyncpg driver scheme parser..."
  }
];

function RecordingsPage() {
  const [recordings, setRecordings] = useState(initialRecordings);
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(35); // mock percent

  function togglePlay(id: string) {
    if (playingId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingId(id);
      setIsPlaying(true);
      setPlayProgress(0);
      // Simulate progress
      const interval = setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 1000);
    }
  }

  function handleDownload(rec: typeof initialRecordings[0]) {
    // Generate and download mock text transcript file
    const element = document.createElement("a");
    const file = new Blob([rec.transcript || "No transcript content available."], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${rec.title.toLowerCase().replace(/\s+/g, "_")}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const activeRec = recordings.find((r) => r.id === playingId);

  return (
    <AppShell title="Recordings">
      <div className="p-8 space-y-6 max-w-[1400px] mx-auto pb-32">
        <div>
          <h2 className="font-display text-3xl text-echo-teal">Voice Recordings & Transcripts</h2>
          <p className="text-sm text-muted-slate mt-1">Access past audio captures, summaries, and structural meeting files</p>
        </div>

        {recordings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-12 text-center space-y-3">
            <div className="text-muted-slate text-sm">No voice recordings or transcripts found.</div>
            <p className="text-xs text-muted-slate/85 max-w-sm mx-auto">
              Any voice intelligence sessions you host or participate in will show up here as archived assets once they end.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-hairline bg-ink-raised overflow-hidden"
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline bg-ink/40 text-muted-slate font-mono-ui text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6 font-medium">Session Title</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Size</th>
                  <th className="p-4 pr-6 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {recordings.map((rec) => {
                  const isActive = playingId === rec.id;
                  const isCurrentPlaying = isActive && isPlaying;
                  return (
                    <tr key={rec.id} className="hover:bg-ink/30 transition">
                      <td className="p-4 pl-6 font-medium">
                        <div className={isActive ? "text-signal-amber" : "text-paper"}>{rec.title}</div>
                        <div className="text-[10px] text-muted-slate font-mono-ui tracking-wide mt-0.5">{rec.roomCode}</div>
                      </td>
                      <td className="p-4 text-muted-slate font-mono-ui text-xs py-6">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-muted-slate/75" />
                          {rec.date}
                        </div>
                      </td>
                      <td className="p-4 text-muted-slate py-6">
                        <div className="flex items-center gap-1.5 font-mono-ui text-xs">
                          <Clock size={14} className="text-muted-slate/75" />
                          {rec.duration}
                        </div>
                      </td>
                      <td className="p-4 text-muted-slate font-mono-ui text-xs">{rec.size}</td>
                      <td className="p-4 pr-6 text-right py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => togglePlay(rec.id)}
                            className={`p-2 rounded transition ${
                              isCurrentPlaying
                                ? "bg-signal-amber text-ink"
                                : "bg-echo-teal/10 hover:bg-echo-teal/20 text-echo-teal"
                            }`}
                            aria-label={isCurrentPlaying ? "Pause" : "Play"}
                          >
                            {isCurrentPlaying ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            onClick={() => handleDownload(rec)}
                            className="p-2 rounded bg-ink border border-hairline hover:bg-ink-raised text-paper/80 transition"
                            aria-label="Download Transcript"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Floating Audio Player Drawer */}
      <AnimatePresence>
        {activeRec && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 bg-ink-raised border-t border-hairline px-6 py-4 z-40 shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-signal-amber text-ink flex items-center justify-center hover:brightness-105 shrink-0"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="min-w-0">
                <div className="font-display text-sm truncate">{activeRec.title}</div>
                <div className="text-[10px] text-muted-slate font-mono-ui">{activeRec.roomCode}</div>
              </div>
            </div>

            {/* Custom scrubber */}
            <div className="flex-1 max-w-xl mx-8 hidden md:flex items-center gap-3">
              <span className="font-mono-ui text-xs text-muted-slate">0:00</span>
              <div className="flex-1 h-1.5 rounded-full bg-ink relative overflow-hidden cursor-pointer">
                <div
                  style={{ width: `${playProgress}%` }}
                  className="absolute inset-y-0 left-0 bg-echo-teal transition-all duration-300"
                />
              </div>
              <span className="font-mono-ui text-xs text-muted-slate">{activeRec.duration}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-slate">
                <Volume2 size={16} />
                <span className="w-16 h-1 rounded-full bg-ink relative hidden sm:block">
                  <span className="absolute inset-y-0 left-0 w-3/4 bg-muted-slate" />
                </span>
              </div>
              <button
                onClick={() => setPlayingId(null)}
                className="text-muted-slate hover:text-paper"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
