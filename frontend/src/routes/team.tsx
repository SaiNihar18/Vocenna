import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { Mail, Shield, Plus, X, User } from "@/lib/icons";
import { api } from "@/lib/vocenna-api";

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

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team | Vocenna" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal states
  const [openInvite, setOpenInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Speaker");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const me = await api.me();
        setMembers([
          {
            id: me.id || "me",
            name: me.name || "User",
            email: me.email,
            role: me.role || "Host",
            avatar: me.avatar,
            status: "Active"
          },
          {
            id: "u_sarah",
            name: "Sarah Jenkins",
            email: "sarah.j@vocenna.io",
            role: "Host",
            avatar: undefined,
            status: "Active"
          },
          {
            id: "u_marcus",
            name: "Marcus Vance",
            email: "marcus.v@vocenna.io",
            role: "Speaker",
            avatar: undefined,
            status: "Away"
          }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);

    // Simulate invite operation with delay
    await new Promise((resolve) => setTimeout(resolve, 600000).catch(() => {}) || setTimeout(resolve, 800));

    const newMember = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: role,
      avatar: undefined,
      status: "Invited"
    };

    setMembers((prev) => [...prev, newMember]);
    setBusy(false);
    setOpenInvite(false);
    setName("");
    setEmail("");
    setRole("Speaker");
  }

  return (
    <AppShell title="Team">
      <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl text-echo-teal">Workspace Members</h2>
            <p className="text-sm text-muted-slate mt-1">Manage team members, roles, and collaboration permissions</p>
          </div>
          <button
            onClick={() => setOpenInvite(true)}
            className="flex items-center gap-2 rounded-lg bg-signal-amber text-[#12161C] font-medium text-sm px-4 py-2 hover:brightness-105 transition"
          >
            <Plus size={16} /> Invite Member
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-slate font-mono-ui text-sm animate-pulse">
            Loading team members...
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {members.map((member) => (
              <motion.div
                key={member.id}
                variants={itemVariants}
                className="rounded-xl border border-hairline bg-ink-raised p-5 space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full border border-hairline bg-ink object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-ink border border-hairline flex items-center justify-center font-mono-ui text-sm font-semibold uppercase text-echo-teal">
                      {member.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg">{member.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-slate mt-0.5">
                      <Shield size={12} className="text-echo-teal" />
                      <span>{member.role}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-hairline/50">
                  <div className="flex items-center gap-2 text-xs text-muted-slate">
                    <Mail size={12} />
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    member.status === "Active" ? "bg-signal-green" : member.status === "Away" ? "bg-signal-amber" : "bg-muted-slate/50 animate-pulse"
                  }`} />
                  <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-slate">{member.status}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Invite Modal Overlay */}
      <AnimatePresence>
        {openInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpenInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-raised border border-hairline rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
                <h3 className="font-display text-xl text-signal-amber">Invite Team Member</h3>
                <button
                  onClick={() => setOpenInvite(false)}
                  className="text-muted-slate hover:text-paper"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-slate font-medium">Full Name</label>
                  <div className="flex items-center gap-2.5 bg-ink border border-hairline rounded-xl px-3 py-2.5">
                    <User size={15} className="text-muted-slate" />
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marcus Aurelius"
                      className="flex-1 bg-transparent text-sm text-paper focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-slate font-medium">Email Address</label>
                  <div className="flex items-center gap-2.5 bg-ink border border-hairline rounded-xl px-3 py-2.5">
                    <Mail size={15} className="text-muted-slate" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. marcus@vocenna.io"
                      className="flex-1 bg-transparent text-sm text-paper focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-slate font-medium">Workspace Role</label>
                  <div className="flex items-center gap-2.5 bg-ink border border-hairline rounded-xl px-3 py-2.5">
                    <Shield size={15} className="text-muted-slate" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-paper focus:outline-none"
                    >
                      <option value="Host">Host (Admin)</option>
                      <option value="Speaker">Speaker (Write)</option>
                      <option value="Listener">Listener (Read Only)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenInvite(false)}
                    className="px-4 py-2 rounded-lg border border-hairline text-sm hover:bg-ink transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-lg bg-signal-amber text-ink font-medium text-sm hover:brightness-105 disabled:opacity-50 flex items-center gap-2 transition"
                  >
                    {busy ? (
                      <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Send Invitation"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
