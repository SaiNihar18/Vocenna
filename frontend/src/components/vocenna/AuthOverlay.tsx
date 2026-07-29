import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";
import { api, setToken } from "@/lib/vocenna-api";
import {
  Key,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  Mic,
  Globe,
  FileText,
  Brain,
} from "@/lib/icons";

/* ─────────────────────────────────────────────
   Animated SVG waveform – multiple layered paths
   that morph independently
   ───────────────────────────────────────────── */
function AnimatedWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useAnimationFrame((_, delta) => {
    timeRef.current += delta * 0.001;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const t = timeRef.current;

    // Layer definitions: [amplitude, frequency, phase, speed, color, opacity, lineWidth, blur]
    const layers: [number, number, number, number, string, number, number][] = [
      [22, 2.1, 0, 1.0, "#E8A33D", 0.9, 2.5],
      [14, 3.2, 1.3, 1.4, "#E8A33D", 0.4, 1.5],
      [10, 1.7, 2.6, 0.7, "#4FB8A6", 0.5, 2.0],
      [18, 2.7, 0.8, 1.2, "#4FB8A6", 0.25, 1.2],
      [8,  4.0, 4.1, 1.8, "#D6567A", 0.2, 1.0],
    ];

    for (const [amp, freq, phase, speed, color, alpha, lw] of layers) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lw;

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = lw * 6;

      for (let x = 0; x <= W; x += 2) {
        const nx = x / W;
        const y =
          H / 2 +
          Math.sin(nx * Math.PI * freq + t * speed + phase) * amp +
          Math.sin(nx * Math.PI * freq * 0.5 + t * speed * 0.6 + phase * 1.7) *
            (amp * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={100}
      className="w-full max-w-[520px] h-[100px]"
    />
  );
}

/* ─────────────────────────────────────────────
   Floating ambient orbs (CSS keyframe approach)
   ───────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large amber blob top-left */}
      <motion.div
        animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-28 -left-28 w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,163,61,0.18) 0%, rgba(232,163,61,0) 70%)",
        }}
      />
      {/* Teal mid blob */}
      <motion.div
        animate={{ x: [0, -25, 10, 0], y: [0, 20, -15, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-1/3 -right-24 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(79,184,166,0.15) 0%, rgba(79,184,166,0) 70%)",
        }}
      />
      {/* Rose bottom */}
      <motion.div
        animate={{ x: [0, 15, -20, 0], y: [0, -10, 20, 0], scale: [1, 1.05, 0.92, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(214,86,122,0.12) 0%, rgba(214,86,122,0) 70%)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature pill
   ───────────────────────────────────────────── */
function FeaturePill({
  icon: Icon,
  label,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm"
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <span className="text-xs text-paper/75 font-medium">{label}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Testimonial / social proof card
   ───────────────────────────────────────────── */
function SocialProofCard() {
  const proofs = [
    { name: "Arjun M.", role: "Product Lead", quote: "Vocenna cut our post-meeting sync time by 80%." },
    { name: "Sofia L.", role: "Engineering Manager", quote: "Real-time transcription in Hindi & English is flawless." },
    { name: "Daniel K.", role: "Startup Founder", quote: "Finally, a meeting tool that actually remembers things." },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % proofs.length), 4000);
    return () => clearInterval(id);
  }, []);

  const p = proofs[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="mt-auto border border-white/10 rounded-2xl p-4 bg-white/5 backdrop-blur-sm relative overflow-hidden"
    >
      {/* Subtle amber line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-amber/50 to-transparent" />
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-paper/80 leading-relaxed italic">"{p.quote}"</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-signal-amber to-echo-teal flex items-center justify-center text-[11px] font-bold text-ink shrink-0">
              {p.name[0]}
            </div>
            <div>
              <div className="text-xs font-semibold text-paper">{p.name}</div>
              <div className="text-[10px] text-muted-slate">{p.role}</div>
            </div>
            {/* Dot indicators */}
            <div className="ml-auto flex gap-1">
              {proofs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === idx ? "bg-signal-amber" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Left hero panel
   ───────────────────────────────────────────── */
function HeroPanel() {
  return (
    <div className="relative hidden lg:flex flex-col h-full p-10 xl:p-12 overflow-hidden select-none">
      <FloatingOrbs />

      {/* Top grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2.5 relative z-10"
      >
        <div className="w-8 h-8 rounded-lg bg-signal-amber/20 border border-signal-amber/30 flex items-center justify-center">
          <Mic size={16} className="text-signal-amber" />
        </div>
        <span className="font-display text-xl text-paper tracking-tight">Vocenna</span>
      </motion.div>

      {/* Headline */}
      <div className="mt-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-xs uppercase tracking-widest text-echo-teal font-semibold mb-3">
            Voice Intelligence Platform
          </p>
          <h1 className="font-display text-4xl xl:text-5xl text-paper leading-[1.1] tracking-tight">
            Every voice,<br />
            <span className="text-signal-amber">understood.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-slate leading-relaxed max-w-xs">
            Vocenna listens, transcribes, translates, and synthesizes your meetings — across 40+ languages, in real time.
          </p>
        </motion.div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.8, ease: "easeOut" }}
          className="mt-10 relative"
        >
          {/* Live pill */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-amber opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-amber" />
            </span>
            <span className="text-[10px] text-muted-slate uppercase tracking-widest font-medium">Live transcription</span>
          </div>
          <AnimatedWaveform />
        </motion.div>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap gap-2">
          <FeaturePill icon={Mic}      label="Live Transcription"      color="#E8A33D" delay={0.7} />
          <FeaturePill icon={Globe}    label="40+ Languages"           color="#4FB8A6" delay={0.8} />
          <FeaturePill icon={FileText} label="AI Meeting Summaries"    color="#E8A33D" delay={0.9} />
          <FeaturePill icon={Brain}    label="Synthesized Memory"      color="#4FB8A6" delay={1.0} />
        </div>
      </div>

      {/* Social proof */}
      <SocialProofCard />
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
      <div className="relative lg:w-[54%] xl:w-[58%] bg-gradient-to-br from-ink via-[#161b23] to-[#0f131a] border-r border-hairline">
        <HeroPanel />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto">
        {/* Subtle ambient glow behind the form */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-signal-amber/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-echo-teal/5 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.1 }}
          className="relative w-full max-w-[400px]"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-signal-amber/20 border border-signal-amber/30 flex items-center justify-center">
              <Mic size={14} className="text-signal-amber" />
            </div>
            <span className="font-display text-lg text-paper">Vocenna</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegister ? "reg" : "login"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
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
                  transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.3 }}
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
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.985 }}
              className="w-full mt-2 py-3 rounded-xl bg-signal-amber text-ink font-semibold text-sm hover:brightness-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-signal-amber/20"
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

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-slate/60">
            By continuing you agree to our{" "}
            <span className="text-muted-slate underline cursor-pointer">Terms</span> &amp;{" "}
            <span className="text-muted-slate underline cursor-pointer">Privacy Policy</span>.
          </p>
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
        <Icon size={15} className="text-muted-slate group-focus-within:text-echo-teal transition-colors shrink-0" />
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
