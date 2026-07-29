import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { Mail, Shield, Plus } from "@/lib/icons";
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

  return (
    <AppShell title="Team">
      <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl text-echo-teal">Workspace Members</h2>
            <p className="text-sm text-muted-slate mt-1">Manage team members, roles, and collaboration permissions</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-signal-amber text-[#12161C] font-medium text-sm px-4 py-2 hover:brightness-105 transition">
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
                    {member.name.split(" ").map((n) => n[0]).join("")}
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
                  member.status === "Active" ? "bg-signal-green" : member.status === "Away" ? "bg-signal-amber" : "bg-muted-slate/50"
                }`} />
                <span className="font-mono-ui text-[9px] uppercase tracking-wider text-muted-slate">{member.status}</span>
              </div>
            </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
