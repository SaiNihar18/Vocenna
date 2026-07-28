import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, setToken } from "@/lib/vocenna-api";
import { Key, Mail, User, Shield, Sparkles, AlertCircle } from "@/lib/icons";

export function AuthOverlay({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Register first
        await api.register({
          email,
          password,
          fullName,
          preferredLanguage,
        });
      }
      // Then login (or direct login)
      await api.login({ email, password });
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      {/* Dynamic Animated background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-echo-teal/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-signal-amber/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md rounded-2xl border border-hairline bg-ink-raised/60 backdrop-blur-xl shadow-2xl p-8 overflow-hidden"
      >
        {/* Top Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-signal-amber/10 text-signal-amber mb-3 border border-signal-amber/20">
            <Shield size={22} className="animate-pulse" />
          </div>
          <h2 className="font-display text-3xl text-signal-amber tracking-tight">
            {isRegister ? "Join Vocenna" : "Welcome Back"}
          </h2>
          <p className="text-sm text-muted-slate mt-2">
            {isRegister
              ? "Create your secure account to start hosting voice intelligence sessions."
              : "Access your dashboard, rooms, and synthesized meeting memory."}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-ink rounded-lg border border-hairline mb-6 relative">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`relative py-2 rounded-md text-sm font-medium transition duration-300 z-10 ${
              !isRegister ? "text-[#12161C]" : "text-paper/80 hover:text-paper"
            }`}
          >
            {!isRegister && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 bg-echo-teal rounded-md -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`relative py-2 rounded-md text-sm font-medium transition duration-300 z-10 ${
              isRegister ? "text-[#12161C]" : "text-paper/80 hover:text-paper"
            }`}
          >
            {isRegister && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 bg-echo-teal rounded-md -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            Register
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-flag-rose/10 border border-flag-rose/20 text-flag-rose text-sm rounded-lg p-3 mb-5 flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-slate font-medium">Full Name</label>
              <div className="flex items-center gap-2.5 bg-ink border border-hairline rounded-lg px-3 py-2.5 transition focus-within:border-echo-teal">
                <User size={16} className="text-muted-slate" />
                <input
                  required
                  type="text"
                  placeholder="Elena Rostova"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-slate/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-muted-slate font-medium">Email Address</label>
            <div className="flex items-center gap-2.5 bg-ink border border-hairline rounded-lg px-3 py-2.5 transition focus-within:border-echo-teal">
              <Mail size={16} className="text-muted-slate" />
              <input
                required
                type="email"
                placeholder="elena@vocenna.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm placeholder:text-muted-slate/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-slate font-medium">Password</label>
            <div className="flex items-center gap-2.5 bg-ink border border-hairline rounded-lg px-3 py-2.5 transition focus-within:border-echo-teal">
              <Key size={16} className="text-muted-slate" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm placeholder:text-muted-slate/50 focus:outline-none"
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-slate font-medium">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full bg-ink border border-hairline rounded-lg px-3 py-2.5 text-sm text-paper/90 focus:outline-none focus:border-echo-teal"
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-lg bg-signal-amber text-[#12161C] font-semibold text-sm hover:brightness-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#12161C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} />
                {isRegister ? "Create Account" : "Access Console"}
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              // Bypass using demo mode
              setToken("demo-jwt-token");
              onAuthenticated();
            }}
            className="text-xs text-echo-teal/70 hover:text-echo-teal transition hover:underline"
          >
            Continue in Preview Mode
          </button>
        </div>
      </motion.div>
    </div>
  );
}
