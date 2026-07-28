import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/vocenna/AppShell";
import { Search, Sparkles, Users, HelpCircle } from "@/lib/icons";
import { api } from "@/lib/vocenna-api";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Vocenna — Memory Search" },
      { name: "description", content: "Ask questions across every past meeting. RAG-powered synthesis with cited sources." },
      { property: "og:title", content: "Vocenna — Memory Search" },
      { property: "og:description", content: "Ask questions across every past meeting. RAG-powered synthesis with cited sources." },
    ],
  }),
  component: MemoryPage,
});

function MemoryPage() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const r = await api.memoryQuery("global", q.trim());
      setAnswer(r);
    } catch (err) {
      console.error("RAG search query failed:", err);
      setAnswer({
        query: q,
        answer: "Failed to synthesize a response from past meetings. Please check backend connection.",
        citations: []
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Memory Search">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="sr-only">Memory Search</h1>

        <div className="rounded-xl border border-hairline bg-ink-raised p-2 flex items-center gap-2">
          <Sparkles size={18} className="text-echo-teal ml-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask your past meetings (e.g. What did we decide about Redis latency?)"
            className="flex-1 bg-transparent py-3 text-lg font-display placeholder:text-muted-slate/70 focus:outline-none"
          />
          <button
            onClick={ask}
            disabled={loading}
            className="w-11 h-11 rounded-lg bg-signal-amber text-[#12161C] flex items-center justify-center hover:brightness-105 disabled:opacity-50"
            aria-label="Search"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#12161C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </button>
        </div>

        {!hasSearched ? (
          <div className="mt-12 rounded-xl border border-dashed border-hairline py-16 flex flex-col items-center justify-center text-muted-slate text-center p-6">
            <HelpCircle size={40} className="text-echo-teal/60 mb-3" />
            <p className="text-base font-medium">Search across your organization's voice archives</p>
            <p className="text-xs max-w-sm mt-1">Vocenna uses RAG (Retrieval Augmented Generation) to scan transcripts, resolve key decisions, and synthesize unified responses with direct citations.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="rounded-xl border border-hairline bg-ink-raised p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-echo-teal" />
                <span className="text-echo-teal font-medium">Synthesized Intelligence</span>
              </div>
              <p className="text-sm leading-relaxed text-paper/90">
                {loading ? "Synthesizing across your voice archives..." : answer?.answer}
              </p>
            </div>

            {answer?.citations && answer.citations.length > 0 && (
              <div>
                <div className="font-mono-ui text-[11px] tracking-widest uppercase text-muted-slate mb-3">
                  Source Citations
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {answer.citations.map((c: any) => (
                    <div key={c.id} className="rounded-xl border border-hairline bg-ink-raised p-4">
                      <p className="font-mono-ui text-sm leading-relaxed text-paper/90">"{c.quote}"</p>
                      <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-muted-slate">
                          <Users size={12} />
                          <span className="text-paper/85">{c.speaker}</span>
                          <span>•</span>
                          <span className="font-mono-ui">{c.location}</span>
                        </div>
                        <div className="flex gap-1" aria-label={`Confidence ${c.confidence} of 3`}>
                          {[1, 2, 3].map((n) => (
                            <span
                              key={n}
                              className={`w-1.5 h-1.5 rounded-full ${
                                n <= c.confidence ? "bg-echo-teal" : "bg-hairline"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
