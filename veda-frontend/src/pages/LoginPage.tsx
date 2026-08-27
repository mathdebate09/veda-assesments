import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
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
      const { token } = await login(email, password);
      setToken(token);
      navigate("/exams", { replace: true });
    } catch (err) {
      setError((err as Error).message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] p-4">
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#303030] rounded-[14px] flex items-center justify-center mb-3 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11L9.5 16.5L18 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a] tracking-tight">VedaAI</h1>
          <span className="text-[13px] text-[#6b6b6b] mt-0.5">AI Teacher's Toolkit</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8">
          <h2 className="text-[20px] font-bold text-[#1a1a1a] mb-1">Welcome back</h2>
          <p className="text-[14px] text-[#6b6b6b] mb-7">Sign in to your teacher account</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-[#1a1a1a]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="h-11 px-4 rounded-[10px] border border-[#e0e0e0] bg-[#fafafa] text-[14px] text-[#1a1a1a] placeholder-[#b0b0b0] outline-none focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-[#1a1a1a]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-[10px] border border-[#e0e0e0] bg-[#fafafa] text-[14px] text-[#1a1a1a] placeholder-[#b0b0b0] outline-none focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b9b9b] hover:text-[#6b6b6b] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 text-[13px] text-red-600">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
                  <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.3" />
                  <path d="M7 4.5V7.5M7 9.5V10" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-11 mt-1 rounded-[10px] bg-[#303030] text-white text-[14px] font-semibold hover:bg-[#1a1a1a] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>

        {/* Orange accent line */}
        <div className="mt-6 h-1 w-12 bg-[#FF5623] rounded-full mx-auto opacity-60" />
      </div>
    </div>
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
