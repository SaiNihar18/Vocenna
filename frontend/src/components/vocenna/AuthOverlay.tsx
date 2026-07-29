import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, setToken, API_BASE } from "@/lib/vocenna-api";
import {
  Key,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  Globe,
  Mic,
  FileText,
} from "@/lib/icons";

/* ─────────────────────────────────────────────
   Animated amber waveform — continuously flowing
   with a hover glow boost and subtle pulse
   ───────────────────────────────────────────── */
const WAVE_PATH = "M0,40 C35,15 95,15 130,40 C165,65 225,65 260,40 C295,15 355,15 390,40 C425,65 485,65 520,40";
const WAVE_LEN = 1200; // approximate path length for dash animation

function AmberWave() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative w-full max-w-[480px] h-16 cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.015 : 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 520 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <filter id="wave-glow-filter" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation={hovered ? "5" : "3"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow halo layer — pulses gently */}
        <motion.path
          d={WAVE_PATH}
          stroke="#E8A33D"
          strokeWidth={hovered ? 10 : 7}
          strokeLinecap="round"
          filter="url(#wave-glow-filter)"
          animate={{ opacity: hovered ? [0.35, 0.55, 0.35] : [0.18, 0.32, 0.18] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Travelling dash — marching ants effect */}
        <motion.path
          d={WAVE_PATH}
          stroke="#E8A33D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${WAVE_LEN * 0.18} ${WAVE_LEN * 0.82}`}
          animate={{ strokeDashoffset: [WAVE_LEN, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          opacity={hovered ? 0.55 : 0.3}
        />

        {/* Main crisp wave line */}
        <motion.path
          d={WAVE_PATH}
          stroke="#E8A33D"
          strokeWidth={hovered ? 3 : 2.5}
          strokeLinecap="round"
          animate={{ opacity: hovered ? 1 : 0.92 }}
          transition={{ duration: 0.3 }}
        />

        {/* Hover shimmer dot that travels along the wave */}
        {hovered && (
          <motion.circle
            r="4"
            fill="#E8A33D"
            filter="url(#wave-glow-filter)"
            animate={{
              cx: [0, 65, 130, 195, 260, 325, 390, 455, 520],
              cy: [40, 21.25, 40, 58.75, 40, 21.25, 40, 58.75, 40],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Left hero panel — stripped back, clean
   ───────────────────────────────────────────── */
function HeroPanel() {
  const proofPoints = [
    { icon: Mic,      label: "Live transcription" },
    { icon: Globe,    label: "40+ languages" },
    { icon: FileText, label: "AI meeting summaries" },
  ];

  return (
    <div className="relative hidden lg:flex flex-col h-full px-10 xl:px-14 py-10 xl:py-12 select-none">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2.5"
      >
        <img src="/vocenna-logo.svg" alt="Vocenna" className="w-7 h-7" />
        <span className="font-display text-xl text-paper tracking-tight">Vocenna</span>
      </motion.div>

      {/* Headline + subtitle */}
      <div className="mt-auto mb-auto flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.65, ease: "easeOut" }}
        >
          <h1 className="font-display text-4xl xl:text-5xl text-paper leading-[1.08] tracking-tight">
            Every voice,<br />understood.
          </h1>
          <p className="mt-4 text-sm text-muted-slate leading-relaxed max-w-[300px]">
            Speak your language. Vocenna listens, translates, and remembers—in real time.
          </p>
        </motion.div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-10"
        >
          <AmberWave />
        </motion.div>

        {/* Proof points */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 flex flex-col gap-3"
        >
          {proofPoints.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2.5 group cursor-default"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <span
                className="shrink-0 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_#E8A33D99]"
                style={{ animationDelay: `${i * 0.9}s` }}
              >
                <Icon size={14} className="text-muted-slate group-hover:text-signal-amber transition-colors duration-300" />
              </span>
              <span className="text-sm text-muted-slate group-hover:text-paper/80 transition-colors duration-300">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reusable input field
   ───────────────────────────────────────────── */
function InputField({
  label,
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-slate font-medium">{label}</label>
      <div className="flex items-center gap-2.5 bg-ink-raised border border-hairline rounded-xl px-3 py-2.5 transition-colors focus-within:border-echo-teal/60 group">
        <Icon
          size={15}
          className="text-muted-slate group-focus-within:text-echo-teal transition-colors shrink-0"
        />
        <input
          required={required}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-paper placeholder:text-muted-slate/40 focus:outline-none"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */
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
  const [isWakingUp, setIsWakingUp] = useState(true);
  const [infoModal, setInfoModal] = useState<"terms" | "privacy" | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function pingBackend() {
      // Get the root backend URL from the API base URL (e.g. remove /api/v1)
      const rootUrl = API_BASE.replace(/\/api\/v1\/?$/, "");
      try {
        await fetch(`${rootUrl}/health`, { 
          mode: "no-cors",
          signal: controller.signal 
        });
        if (active) {
          setIsWakingUp(false);
        }
      } catch (err) {
        if (active) {
          // Fetch failed (network error/timeout during spinup), retry in 2.5s
          setTimeout(pingBackend, 2500);
        }
      }
    }

    pingBackend();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await api.register({ email, password, fullName, preferredLanguage });
      }
      await api.login({ email, password });
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-ink overflow-hidden">
      {/* ── Left hero panel ── */}
      <div className="relative lg:w-[52%] xl:w-[56%] border-r border-hairline">
        <HeroPanel />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/vocenna-logo.svg" alt="Vocenna" className="w-6 h-6" />
            <span className="font-display text-lg text-paper">Vocenna</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegister ? "reg" : "login"}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-3xl text-paper tracking-tight">
                  {isRegister ? "Create account" : "Welcome back"}
                </h2>
                <p className="text-sm text-muted-slate mt-2 leading-relaxed">
                  {isRegister
                    ? "Start hosting voice intelligence sessions today."
                    : "Access your dashboard, rooms, and meeting memory."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tab Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-ink-raised rounded-xl border border-hairline mb-6">
            {(["Sign In", "Register"] as const).map((label, i) => {
              const active = i === 0 ? !isRegister : isRegister;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setIsRegister(i === 1); setError(""); }}
                  className={`relative py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 z-10 ${
                    active ? "text-ink" : "text-paper/60 hover:text-paper"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 bg-signal-amber rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Backend Waking Up Status Alert */}
          <AnimatePresence>
            {isWakingUp && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: 20 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="bg-signal-amber/10 border border-signal-amber/20 text-signal-amber text-sm rounded-xl p-3 flex items-start gap-3 overflow-hidden"
              >
                <div className="w-4 h-4 border-2 border-signal-amber border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-xs">Waking up Vocenna engine...</span>
                  <span className="text-xs text-paper/70 block leading-relaxed">
                    Our voice translation and intelligence platform is initializing. Please wait a moment while the secure server spins up.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-flag-rose/10 border border-flag-rose/20 text-flag-rose text-sm rounded-xl p-3 mb-5 flex items-start gap-2.5 overflow-hidden"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  key="fullname"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <InputField
                    label="Full Name"
                    icon={User}
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={setFullName}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
            />

            <InputField
              label="Password"
              icon={Key}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              required
            />

            <AnimatePresence>
              {isRegister && (
                <motion.div
                  key="lang"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-slate font-medium">Preferred Language</label>
                    <div className="flex items-center gap-2.5 bg-ink-raised border border-hairline rounded-xl px-3 py-2.5 transition-colors focus-within:border-echo-teal/60">
                      <Globe size={15} className="text-muted-slate shrink-0" />
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-paper/90 focus:outline-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="fr">French (Français)</option>
                        <option value="de">German (Deutsch)</option>
                        <option value="zh">Chinese (中文)</option>
                        <option value="ar">Arabic (العربية)</option>
                        <option value="pt">Portuguese (Português)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.012 }}
              whileTap={{ scale: loading ? 1 : 0.988 }}
              className="w-full mt-2 py-3 rounded-xl bg-signal-amber text-ink font-semibold text-sm hover:brightness-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-signal-amber/15"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={15} />
                  {isRegister ? "Create Account" : "Access Console"}
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-slate/50">
            By continuing you agree to our{" "}
            <span
              onClick={() => setInfoModal("terms")}
              className="text-muted-slate/70 underline cursor-pointer hover:text-signal-amber transition-colors"
            >
              Terms
            </span>{" "}
            &amp;{" "}
            <span
              onClick={() => setInfoModal("privacy")}
              className="text-muted-slate/70 underline cursor-pointer hover:text-signal-amber transition-colors"
            >
              Privacy Policy
            </span>.
          </p>
        </motion.div>
      </div>

      {/* Info Overlay Modal for Terms / Privacy */}
      <AnimatePresence>
        {infoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInfoModal(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-raised border border-hairline rounded-xl w-full max-w-md p-6 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                <h3 className="font-display text-xl text-signal-amber">
                  {infoModal === "terms" ? "Terms of Service" : "Privacy Policy"}
                </h3>
                <button
                  onClick={() => setInfoModal(null)}
                  className="text-muted-slate hover:text-paper text-sm font-semibold"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-paper/85 leading-relaxed max-h-[300px] overflow-y-auto pr-1 space-y-3 font-sans">
                {infoModal === "terms" ? (
                  <>
                    <p>Welcome to Vocenna. By using our voice collaboration and intelligence services, you agree to the following terms:</p>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-echo-teal">1. Core Services</h4>
                    <p>Vocenna provides real-time voice translation, speech transcription, sentiment diagnostics, and RAG meeting search tools.</p>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-echo-teal">2. Intellectual Property</h4>
                    <p>You retain full ownership of all voice recordings, meeting summaries, and transcripts processed on our server.</p>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-echo-teal">3. User Responsibility</h4>
                    <p>You are responsible for obtaining appropriate consent from meeting participants before starting audio capture.</p>
                  </>
                ) : (
                  <>
                    <p>Your privacy is central to Vocenna. Here is how we handle and protect your session assets:</p>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-echo-teal">1. Data Minimization</h4>
                    <p>Voice streams are analyzed in real-time. Transcripts and summary notes are stored securely using Supabase DB pooling.</p>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-echo-teal">2. Encryption</h4>
                    <p>All database queries and WebSocket channels use TLS/SSL encryption. Authentication relies on cryptographically signed JWT tokens.</p>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-echo-teal">3. Control</h4>
                    <p>You can permanently delete voice recordings, meeting reports, or transcripts at any time via the Vocenna settings panel.</p>
                  </>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setInfoModal(null)}
                  className="px-4 py-2 bg-signal-amber text-ink rounded-lg font-medium text-xs hover:brightness-105 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
