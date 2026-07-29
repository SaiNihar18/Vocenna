import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { Globe, Shield, User, HelpCircle } from "@/lib/icons";
import { api } from "@/lib/vocenna-api";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Vocenna" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = await api.me();
        setUser(u);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppShell title="Settings">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="p-8 space-y-6 max-w-[1000px] mx-auto"
      >
        <div>
          <h2 className="font-display text-3xl text-echo-teal">Account Settings</h2>
          <p className="text-sm text-muted-slate mt-1">Configure your personal preferences and voice engine options</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Navigation categories */}
          <div className="md:col-span-1 space-y-2">
            <button className="w-full text-left px-4 py-2.5 rounded-lg bg-ink-raised border border-hairline text-echo-teal text-sm font-medium transition">
              Profile
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-ink-raised text-paper/85 text-sm transition">
              Voice & Audio
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-ink-raised text-paper/85 text-sm transition">
              Security
            </button>
          </div>

          {/* Configuration form */}
          <div className="md:col-span-2 rounded-xl border border-hairline bg-ink-raised p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12 text-muted-slate font-mono-ui text-sm animate-pulse">
                Loading profile details...
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="font-display text-lg border-b border-hairline pb-2 flex items-center gap-2">
                    <User size={18} className="text-echo-teal" /> Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Full Name</label>
                      <input
                        value={user?.name || ""}
                        onChange={(e) => setUser((prev: any) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Email Address</label>
                      <input
                        value={user?.email || ""}
                        disabled
                        className="w-full bg-ink/50 border border-hairline rounded-lg px-3 py-2 text-sm text-muted-slate focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-lg border-b border-hairline pb-2 flex items-center gap-2">
                    <Globe size={18} className="text-echo-teal" /> Voice Engine Defaults
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Input Language</label>
                      <select className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal">
                        <option value="en">English (US)</option>
                        <option value="es">Español (ES)</option>
                        <option value="fr">Français (FR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Speech Model Size</label>
                      <select className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal">
                        <option value="base">Base (Fastest)</option>
                        <option value="small">Small (Balanced)</option>
                        <option value="medium">Medium (Accurate)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-hairline/60">
                  <button className="px-4 py-2 text-sm rounded bg-ink border border-hairline hover:bg-ink-hover transition">
                    Reset
                  </button>
                  <button className="px-4 py-2 text-sm rounded bg-echo-teal text-[#12161C] font-medium hover:brightness-105 transition">
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
