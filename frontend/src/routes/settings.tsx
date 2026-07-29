import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/vocenna/AppShell";
import { Globe, Shield, User, Key, AlertCircle } from "@/lib/icons";
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
  const [originalUser, setOriginalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "voice" | "security">("profile");

  // Voice States
  const [inputLanguage, setInputLanguage] = useState("en");
  const [speechModel, setSpeechModel] = useState("small");

  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI Toast State
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const u = await api.me();
        setUser(u);
        setOriginalUser(u);
        setInputLanguage(u.language || "en");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSave() {
    // Mock save operation
    setOriginalUser({ ...user, language: inputLanguage });
    showToast("Settings saved successfully!");
  }

  function handleReset() {
    if (activeTab === "profile") {
      setUser(originalUser);
    } else if (activeTab === "voice") {
      setInputLanguage(originalUser?.language || "en");
      setSpeechModel("small");
    } else if (activeTab === "security") {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    showToast("Form reset to default values.");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

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

        {/* Action toast message */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-echo-teal/15 border border-echo-teal/30 text-echo-teal text-xs px-4 py-2.5 rounded-lg flex items-center gap-2"
            >
              <AlertCircle size={14} />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Navigation categories */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                activeTab === "profile"
                  ? "bg-ink-raised border-hairline text-echo-teal font-semibold"
                  : "border-transparent text-paper/85 hover:bg-ink-raised"
              }`}
            >
              <span className="flex items-center gap-2">
                <User size={14} /> Profile
              </span>
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                activeTab === "voice"
                  ? "bg-ink-raised border-hairline text-echo-teal font-semibold"
                  : "border-transparent text-paper/85 hover:bg-ink-raised"
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe size={14} /> Voice & Audio
              </span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                activeTab === "security"
                  ? "bg-ink-raised border-hairline text-echo-teal font-semibold"
                  : "border-transparent text-paper/85 hover:bg-ink-raised"
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield size={14} /> Security
              </span>
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
                <AnimatePresence mode="wait">
                  {activeTab === "profile" && (
                    <motion.div
                      key="profile-tab"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <h3 className="font-display text-lg border-b border-hairline pb-2 flex items-center gap-2">
                        <User size={18} className="text-echo-teal" /> Personal Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </motion.div>
                  )}

                  {activeTab === "voice" && (
                    <motion.div
                      key="voice-tab"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <h3 className="font-display text-lg border-b border-hairline pb-2 flex items-center gap-2">
                        <Globe size={18} className="text-echo-teal" /> Voice Engine Defaults
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Input Language</label>
                          <select
                            value={inputLanguage}
                            onChange={(e) => setInputLanguage(e.target.value)}
                            className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal"
                          >
                            <option value="en">English (US)</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="es">Español (ES)</option>
                            <option value="fr">Français (FR)</option>
                            <option value="de">German (Deutsch)</option>
                            <option value="zh">Chinese (中文)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Speech Model Size</label>
                          <select
                            value={speechModel}
                            onChange={(e) => setSpeechModel(e.target.value)}
                            className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal"
                          >
                            <option value="base">Base (Fastest)</option>
                            <option value="small">Small (Balanced)</option>
                            <option value="medium">Medium (Accurate)</option>
                            <option value="large">Large (Deep)</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "security" && (
                    <motion.div
                      key="security-tab"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <h3 className="font-display text-lg border-b border-hairline pb-2 flex items-center gap-2">
                        <Key size={18} className="text-echo-teal" /> Security Controls
                      </h3>
                      <div className="space-y-3 max-w-md">
                        <div>
                          <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-slate font-mono-ui uppercase mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-echo-teal"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end gap-3 pt-4 border-t border-hairline/60">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm rounded bg-ink border border-hairline hover:bg-ink-raised transition"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm rounded bg-echo-teal text-[#12161C] font-medium hover:brightness-105 transition"
                  >
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
