import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { Play, Calendar, Clock, Download } from "@/lib/icons";


export const Route = createFileRoute("/recordings")({
  head: () => ({
    meta: [
      { title: "Recordings | Vocenna" },
    ],
  }),
  component: RecordingsPage,
});

const mockRecordings: any[] = [];

function RecordingsPage() {
  return (
    <AppShell title="Recordings">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="p-8 space-y-6 max-w-[1400px] mx-auto"
      >
        <div>
          <h2 className="font-display text-3xl text-echo-teal">Voice Recordings & Transcripts</h2>
          <p className="text-sm text-muted-slate mt-1">Access past audio captures, summaries, and structural meeting files</p>
        </div>

        {mockRecordings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-12 text-center space-y-3">
            <div className="text-muted-slate text-sm">No voice recordings or transcripts found.</div>
            <p className="text-xs text-muted-slate/85 max-w-sm mx-auto">
              Any voice intelligence sessions you host or participate in will show up here as archived assets once they end.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-hairline bg-ink-raised overflow-hidden">
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
                {mockRecordings.map((rec) => (
                  <tr key={rec.id} className="hover:bg-ink-hover/40 transition">
                    <td className="p-4 pl-6 font-medium">
                      <div>{rec.title}</div>
                      <div className="text-[10px] text-muted-slate font-mono-ui tracking-wide mt-0.5">{rec.roomCode}</div>
                    </td>
                    <td className="p-4 text-muted-slate flex items-center gap-1.5 py-6">
                      <Calendar size={14} />
                      {rec.date}
                    </td>
                    <td className="p-4 text-muted-slate py-6">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {rec.duration}
                      </div>
                    </td>
                    <td className="p-4 text-muted-slate font-mono-ui text-xs">{rec.size}</td>
                    <td className="p-4 pr-6 text-right py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded bg-echo-teal/10 hover:bg-echo-teal/20 text-echo-teal transition" aria-label="Play">
                          <Play size={14} />
                        </button>
                        <button className="p-2 rounded bg-ink border border-hairline hover:bg-ink-hover text-paper/80 transition" aria-label="Download">
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
