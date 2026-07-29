import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import {
  CheckCircle2, Circle, Copy, Download, Mic, Sparkles, AlertCircle
} from "@/lib/icons";
import { api, mockSentiment, mockSummary } from "@/lib/vocenna-api";

export const Route = createFileRoute("/rooms/$roomId/summary")({
  head: ({ params }) => ({
    meta: [
      { title: `Meeting Summary | Vocenna` },
      { name: "description", content: "AI summary, decisions, and action items from your Vocenna voice meeting." },
      { property: "og:title", content: `Meeting Summary | Vocenna` },
      { property: "og:description", content: "AI summary, decisions, and action items from your Vocenna voice meeting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { roomId } = useParams({ from: "/rooms/$roomId/summary" });
  const [summary, setSummary] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const [sumData, sentData] = await Promise.all([
          api.summary(roomId),
          api.sentiment(roomId),
        ]);
        setSummary(sumData);
        setSentiment(sentData);
        setItems(sumData.action_items || []);
      } catch (err) {
        console.error("Error loading summary from backend:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [roomId]);

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  const [activeTab, setActiveTab] = useState("overview");

  const displaySummary = summary || mockSummary;
  const displaySentiment = sentiment || mockSentiment;

  return (
    <AppShell title="Archive">
      <div className="p-8 max-w-[1000px] mx-auto space-y-8">
        {/* Meeting Header Meta */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline pb-6 gap-4">
          <div className="flex items-start gap-3">
            <Mic size={24} className="text-signal-amber mt-1" />
            <div>
              <h2 className="font-display text-3xl leading-tight">Meeting Intelligence Report</h2>
              <p className="text-sm text-muted-slate mt-1 font-mono-ui">Room ID: {roomId}</p>
            </div>
          </div>
          <button className="self-start md:self-auto px-4 py-2 rounded-lg border border-hairline text-sm hover:bg-ink-raised transition">
            Export Report
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-hairline gap-2 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview", icon: Sparkles },
            { id: "decisions", label: "Key Decisions", icon: null },
            { id: "action_items", label: "Action Items", icon: CheckCircle2 },
            { id: "sentiment", label: "Sentiment Analysis", icon: null },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative px-4 py-3 text-sm font-medium transition duration-300 whitespace-nowrap focus:outline-none ${
                  active ? "text-echo-teal" : "text-paper/70 hover:text-paper"
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon size={14} />}
                  {t.id === "decisions" && <span className="text-signal-amber">◈</span>}
                  {t.id === "sentiment" && <span className="text-flag-rose">❁</span>}
                  {t.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="summary-active-tab"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-echo-teal"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Report Body */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-slate gap-3">
              <span className="w-8 h-8 border-2 border-echo-teal border-t-transparent rounded-full animate-spin" />
              <span>Generating AI Summary and Sentiment Analysis...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && (
                  <section className="rounded-xl border border-hairline bg-ink-raised p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-echo-teal/15 text-echo-teal flex items-center justify-center">
                        <Sparkles size={16} />
                      </span>
                      <h3 className="font-display text-2xl">AI Summary</h3>
                    </div>
                    {displaySummary.paragraphs.map((p: string, i: number) => (
                      <p key={i} className="text-sm leading-relaxed text-paper/85 mb-3">{p}</p>
                    ))}
                    {displaySummary.takeaways && displaySummary.takeaways.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-hairline/50">
                        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-muted-slate mb-2">
                          Key Takeaways
                        </div>
                        <ul className="space-y-2">
                          {displaySummary.takeaways.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 size={14} className="text-echo-teal mt-0.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {displaySummary.topics && displaySummary.topics.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-hairline/50">
                        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-muted-slate mb-2">
                          Discussion Topics
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {displaySummary.topics.map((t: string) => (
                            <span key={t} className="font-mono-ui text-xs px-2.5 py-1 rounded-full bg-ink border border-hairline">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex gap-2 pt-4 border-t border-hairline/50">
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-hairline text-xs hover:bg-ink">
                        <Sparkles size={12} /> Regenerate Summary
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-hairline text-xs hover:bg-ink">
                        <Copy size={12} /> Copy to Clipboard
                      </button>
                    </div>
                  </section>
                )}

                {activeTab === "decisions" && (
                  <section className="rounded-xl border border-hairline bg-ink-raised p-6">
                    <h3 className="font-display text-2xl mb-6 flex items-center gap-2">
                      <span className="text-signal-amber">◈</span> Key Decisions
                    </h3>
                    {displaySummary.key_decisions && displaySummary.key_decisions.length > 0 ? (
                      <ul className="space-y-4 border-l border-hairline pl-5">
                        {displaySummary.key_decisions.map((d: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-signal-amber mt-2 shrink-0" />
                            <span className="text-paper/90 leading-relaxed">{d}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-slate">No key decisions identified from the meeting transcript.</p>
                    )}
                  </section>
                )}

                {activeTab === "action_items" && (
                  <section className="rounded-xl border border-hairline bg-ink-raised p-6 space-y-6">
                    <h3 className="font-display text-2xl mb-4 flex items-center gap-2 text-echo-teal">
                      <CheckCircle2 size={20} /> Action Items
                    </h3>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-slate">No action items detected from the meeting transcript.</p>
                    ) : (
                      <ul className="space-y-3">
                        {items.map((i) => (
                          <motion.li
                            key={i.id}
                             layout
                            className="flex items-center justify-between rounded-lg border border-hairline bg-ink px-4 py-3"
                          >
                            <button
                              onClick={() => toggle(i.id)}
                              className="flex items-center gap-3 text-sm text-left flex-1"
                            >
                              {i.done ? (
                                <CheckCircle2 size={16} className="text-echo-teal shrink-0" />
                              ) : (
                                <Circle size={16} className="text-muted-slate shrink-0" />
                              )}
                              <span className={i.done ? "line-through text-muted-slate" : ""}>{i.text}</span>
                            </button>
                            <span className="inline-flex items-center gap-1.5 text-xs bg-ink-raised px-2.5 py-1 rounded-full border border-hairline">
                              <span className="w-4 h-4 rounded-full bg-signal-amber/40" />
                              {i.assignee}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {activeTab === "sentiment" && (
                  <section className="rounded-xl border border-hairline bg-ink-raised p-6 space-y-6">
                    <h3 className="font-display text-2xl flex items-center gap-2 text-flag-rose">
                      ❁ Room Mood & Sentiment
                    </h3>
                    <div className="bg-ink border border-hairline rounded-xl p-6">
                      <div className="grid grid-cols-3 mb-3 text-xs font-mono-ui">
                        <span className="text-echo-teal">Constructive ({displaySentiment.constructive}%)</span>
                        <span className="text-muted-slate text-center">Neutral ({displaySentiment.neutral}%)</span>
                        <span className="text-flag-rose text-right">Tense ({displaySentiment.tense}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden flex bg-hairline">
                        <div style={{ width: `${displaySentiment.constructive}%` }} className="bg-echo-teal" />
                        <div style={{ width: `${displaySentiment.neutral}%` }} className="bg-muted-slate/60" />
                        <div style={{ width: `${displaySentiment.tense}%` }} className="bg-flag-rose" />
                      </div>
                      <p className="mt-4 text-sm text-paper/85 leading-relaxed">{displaySentiment.note}</p>
                    </div>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Download Report Actions */}
        {!loading && (
          <div className="pt-6 border-t border-hairline flex items-center justify-center gap-6">
            <button className="flex items-center gap-2 text-xs text-muted-slate hover:text-paper transition">
              <Download size={14} /> <span className="font-mono-ui">Download .TXT</span>
            </button>
            <button className="flex items-center gap-2 text-xs text-muted-slate hover:text-paper transition">
              <Download size={14} /> <span className="font-mono-ui">Download .JSON</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SectionDivider() {
  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 120 20" className="w-24 text-hairline" fill="none" stroke="currentColor">
        <path d="M0 10 Q 30 -5 60 10 T 120 10" />
      </svg>
    </div>
  );
}
