import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Lock, X } from "@/lib/icons";
import { api, type Room } from "@/lib/vocenna-api";

export function CreateRoomModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (r: Room) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [capacity, setCapacity] = useState(120);
  const [created, setCreated] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);

  const previewCode = "VOC-9921-X";

  async function submit() {
    setBusy(true);
    const r = await api.createRoom({ title: title || "Untitled", isPrivate, capacity });
    setBusy(false);
    setCreated(r);
    onCreated?.(r);
  }

  function reset() {
    setTitle(""); setDescription(""); setIsPrivate(true); setPasscode("");
    setCapacity(120); setCreated(null);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-xl border border-hairline bg-ink-raised shadow-2xl overflow-hidden"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-hairline flex items-center justify-between">
              <h2 className="font-display text-2xl text-signal-amber">
                {created ? "Room Created" : "Create New Voice Room"}
              </h2>
              <button onClick={() => { reset(); onClose(); }} className="text-muted-slate hover:text-paper">
                <X size={18} />
              </button>
            </div>

            {!created ? (
              <div className="p-6 space-y-5">
                <Field label="Room Title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Weekly Sync"
                    className="w-full bg-ink border border-hairline rounded-lg px-3 py-2.5 text-sm font-mono-ui placeholder:text-muted-slate/70 focus:outline-none focus:border-echo-teal"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this session about?"
                    className="w-full bg-ink border border-hairline rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-slate/70 focus:outline-none focus:border-echo-teal resize-none"
                  />
                </Field>

                <Field label="Privacy">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-ink rounded-lg border border-hairline">
                    <SegBtn active={!isPrivate} onClick={() => setIsPrivate(false)}>Public</SegBtn>
                    <SegBtn active={isPrivate} onClick={() => setIsPrivate(true)}>Private</SegBtn>
                  </div>
                </Field>

                <AnimatePresence>
                  {isPrivate && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <Field label="Passcode">
                        <div className="flex items-center gap-2 bg-ink border border-hairline rounded-lg px-3">
                          <Lock size={14} className="text-muted-slate" />
                          <input
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Enter passcode"
                            className="flex-1 bg-transparent py-2.5 text-sm font-mono-ui placeholder:text-muted-slate/70 focus:outline-none"
                          />
                        </div>
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-paper/90">Max Participants</label>
                    <span className="font-mono-ui text-sm text-echo-teal">{capacity}</span>
                  </div>
                  <input
                    type="range" min={2} max={500} value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full accent-echo-teal"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-hairline bg-ink px-3 py-2.5">
                  <span className="text-sm text-paper/85">Room Code:</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono-ui text-sm text-signal-amber bg-ink-raised px-2 py-0.5 rounded">
                      {previewCode}
                    </span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(previewCode)}
                      className="text-muted-slate hover:text-paper" aria-label="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-sm text-paper/80">Share this room code with participants:</p>
                <div className="flex items-center justify-between rounded-lg border border-hairline bg-ink px-4 py-3">
                  <span className="font-mono-ui text-signal-amber text-lg">{created.code}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(created.code)}
                    className="text-muted-slate hover:text-paper flex items-center gap-1 text-xs"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t border-hairline flex items-center justify-end gap-3">
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-4 py-2 text-sm text-paper/85 hover:text-paper"
              >
                {created ? "Close" : "Cancel"}
              </button>
              {!created && (
                <button
                  onClick={submit}
                  disabled={busy}
                  className="px-5 py-2 rounded-lg bg-signal-amber text-[#12161C] font-medium text-sm hover:brightness-105 disabled:opacity-60"
                >
                  {busy ? "Creating…" : "Create Voice Room"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-paper/90 mb-2">{label}</label>
      {children}
    </div>
  );
}
function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-md text-sm font-medium transition ${
        active ? "bg-echo-teal text-[#12161C]" : "text-paper/80 hover:bg-ink-raised"
      }`}
    >
      {children}
    </button>
  );
}
