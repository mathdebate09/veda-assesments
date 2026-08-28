import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import vedaLogo from "@/assets/logos/vedaai.png";

export default function LandingPage() {
    const navigate = useNavigate();
    const loggedIn = isAuthenticated();

    return (
        <main className="flex min-h-full items-center justify-center bg-gradient-to-br from-[#f7f7f7] via-[#f1eeeb] to-[#e7e1dc] px-5 py-10">
            <section className="w-full max-w-[520px] rounded-[24px] border border-white/80 bg-white/85 p-7 text-center shadow-[0_16px_45px_rgba(37,32,29,0.10)] backdrop-blur-md sm:p-10">
                <img src={vedaLogo} alt="VedaAI" className="mx-auto h-14 w-14 rounded-[14px] object-cover shadow-sm" />
                <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#FF5623]">VedaAI</p>
                <h1 className="mt-2 text-[30px] font-bold leading-tight text-[#1a1a1a]">Assessment, made clearer.</h1>
                <p className="mx-auto mt-3 max-w-[360px] text-[14px] leading-relaxed text-[#6b6b6b]">
                    A focused workspace for classrooms, exams, and meaningful student feedback.
                </p>
                <button
                    type="button"
                    onClick={() => navigate(loggedIn ? "/home" : "/login")}
                    className="mt-7 rounded-full bg-[#303030] px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a1a1a]"
                >
                    {loggedIn ? "Open workspace" : "Get started"}
                </button>
            </section>
        </main>
    );
}
