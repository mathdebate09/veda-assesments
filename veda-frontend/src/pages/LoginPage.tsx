import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import vedaLogo from "@/assets/logos/vedaai.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUserInfo } = useSidebar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      setToken(token);
      setUserInfo({
        name: user.name,
        instituteName: user.institute?.name ?? "",
        instituteLocation: user.institute?.location ?? "",
        instituteLogo: user.institute?.logoUrl ?? undefined,
      });
      navigate("/exams", { replace: true });
    } catch (err) {
      setError((err as Error).message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row">

      {/* ── Left panel: branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#1a1a1a] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Floating glow blob */}
        <div className="absolute top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full bg-[#FF5623] opacity-10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-[#FF5623] opacity-8 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src={vedaLogo} alt="VedaAI" className="w-10 h-10 rounded-[10px]" />
          <span className="text-white text-[20px] font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            VedaAI
          </span>
        </div>

        {/* Main copy */}
        <div className="relative">
          {/* AI sparkle badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <SparklesIcon />
            <span className="text-white/80 text-[13px]" style={{ fontFamily: "Arial, sans-serif" }}>AI Teacher&apos;s Toolkit</span>
          </div>

          <h1 className="text-white text-[46px] font-bold leading-[1.1] tracking-tight mb-6" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Grade smarter,<br />
            <span className="text-[#FF5623]">not harder.</span>
          </h1>
          <p className="text-white/50 text-[16px] leading-relaxed max-w-[380px]">
            Upload question papers and answer sheets. Let AI do the heavy lifting — extraction, mapping, grading, and feedback in minutes.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 mt-8">
            {["AI Grading", "Answer Mapping", "Instant Feedback", "Class Analytics"].map((f) => (
              <span key={f} className="bg-white/8 border border-white/12 text-white/60 text-[12px] px-3.5 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-white/25 text-[12px]">
          Built for teachers · Powered by AI
        </p>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#f7f7f7] to-[#eeecec] px-6 py-12">

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <img src={vedaLogo} alt="VedaAI" className="w-9 h-9 rounded-[9px]" />
          <span className="text-[#1a1a1a] text-[20px] font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            VedaAI
          </span>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#1a1a1a] tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Welcome back
            </h2>
            <p className="text-[14px] text-[#6b6b6b] mt-1.5">
              Sign in to your teacher account to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-semibold text-[#1a1a1a]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="h-11 px-4 rounded-[10px] border border-[#e0e0e0] bg-white text-[14px] text-[#1a1a1a] placeholder-[#b8b8b8] outline-none focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.08)] transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-[#1a1a1a]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[12px] text-[#FF5623] hover:text-[#e04e1f] font-medium transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-[10px] border border-[#e0e0e0] bg-white text-[14px] text-[#1a1a1a] placeholder-[#b8b8b8] outline-none focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.08)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#6b6b6b] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 text-[13px] text-red-600">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="mt-0.5 shrink-0">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="#ef4444" strokeWidth="1.3" />
                  <path d="M7.5 4.5V8M7.5 10.5V11" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-11 mt-1 rounded-[10px] bg-[#1a1a1a] text-white text-[14px] font-semibold hover:bg-[#303030] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.18)]"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#e8e8e8]" />
            <span className="text-[12px] text-[#b0b0b0] font-medium">or</span>
            <div className="flex-1 h-px bg-[#e8e8e8]" />
          </div>

          {/* SSO placeholder */}
          <button
            type="button"
            className="w-full h-11 rounded-[10px] border border-[#e0e0e0] bg-white text-[14px] font-medium text-[#1a1a1a] flex items-center justify-center gap-2.5 hover:bg-[#f5f5f5] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.302 0-9.81-3.417-11.387-8.083l-6.571 4.819C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
              <path d="M43.611 20.083H42V20H24v8h11.303C34.769 31.28 32.119 33.979 28.805 35.24l6.19 5.238C34.438 40.785 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
            </svg>
            Magic login, coming soon
          </button>

          <p className="text-center text-[12px] text-[#b0b0b0] mt-8">
            Don&apos;t have an account?{" "}
            <span className="text-[#FF5623] font-medium cursor-pointer hover:underline">Contact your admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 8C7 8 8 7 8 3C8 7 9 8 13 8C9 8 8 9 8 13C8 9 7 8 3 8Z" fill="#FF5623" />
      <path d="M0.5 4C2.5 4 3 3.5 3 1.5C3 3.5 3.5 4 5.5 4C3.5 4 3 4.5 3 6.5C3 4.5 2.5 4 0.5 4Z" fill="#FF5623" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2L14 14M6.59 6.6A2 2 0 0 0 9.4 9.4M5.2 4.21C3.47 5.11 2 7 2 7C2 7 4.5 12 8 12C8.97 12 9.86 11.72 10.64 11.29M9 3.2C9.33 3.07 9.67 3 10 3C12.5 3 15 8 15 8C15 8 14.24 9.47 13 10.67" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
