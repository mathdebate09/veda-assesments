import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import vedaLogo from "@/assets/logos/vedaai.png";

const products = [
    { num: "01", title: "AI Exam Grader", text: "Grade subjective and objective exams with AI accuracy. Teachers stay in full control." },
    { num: "02", title: "Assignment Grader", text: "Automated evaluation with rubric-based feedback and consistent, auditable results." },
    { num: "03", title: "Teacher Toolkit", text: "Generate lesson plans, question papers, and rubrics in minutes — not hours." },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const loggedIn = isAuthenticated();

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdfb,_#f5f1ec_38%,_#efe9e2_100%)] text-[#1a1a1a]">

            {/* Nav */}
            <header className="px-4 pt-4 pb-3 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1200px] flex items-center justify-between rounded-full border border-[#ece3dc] bg-white/70 px-4 py-2.5 shadow-[0_6px_20px_rgba(28,22,16,0.04)] backdrop-blur-md sm:px-5">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src={vedaLogo} alt="VedaAI logo" className="h-8 w-8 rounded-[8px] object-cover" />
                        <span className="text-[1rem] font-bold tracking-[-0.04em] text-[#1a1a1a]">VedaAI</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link to="/calculator" className="rounded-full bg-[#ff5623] px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#e04d1e]">
                            See pricing
                        </Link>
                        <button
                            type="button"
                            onClick={() => navigate(loggedIn ? "/home" : "/login")}
                            className="rounded-full bg-[#1a1a1a] px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#303030]"
                        >
                            {loggedIn ? "Open workspace" : "Sign in"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">

                {/* Hero */}
                <section className="pt-16 pb-14 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#ece3dc] bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#5d5b5a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ff5623]" />
                        Incubated at IIM Bangalore
                    </div>

                    <h1 className="mx-auto mt-6 max-w-[700px] text-5xl font-bold leading-[1.02] tracking-[-0.06em] text-[#1a1a1a] sm:text-6xl lg:text-[4.25rem]">
                        Grade smarter,{" "}
                        <span className="text-[#ff5623]">teach better.</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-[480px] text-base leading-7 text-[#5d5b5a]">
                        VedaAI turns handwritten answer sheets into structured classroom insight — saving teachers 30+ hours a month.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(loggedIn ? "/home" : "/login")}
                            className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#303030]"
                        >
                            {loggedIn ? "Open workspace" : "Get started free"}
                        </button>
                        <Link to="/calculator" className="rounded-full border border-[#ece3dc] bg-white px-6 py-3 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f5f2]">
                            See pricing →
                        </Link>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                        {["98% teacher acceptance", "30+ hrs saved / month", "Free for teachers"].map((s) => (
                            <span key={s} className="rounded-full border border-[#ece3dc] bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#42403e]">{s}</span>
                        ))}
                    </div>
                </section>

                {/* Products */}
                <section className="pb-10 grid gap-4 md:grid-cols-3">
                    {products.map(({ num, title, text }) => (
                        <div key={num} className="rounded-[22px] border border-[#ece3dc] bg-white/70 p-5 shadow-[0_8px_24px_rgba(34,24,18,0.05)]">
                            <span className="text-[10px] font-bold tracking-[0.12em] text-[#ff5623]">{num}</span>
                            <h3 className="mt-2.5 text-base font-bold tracking-[-0.03em] text-[#1a1a1a]">{title}</h3>
                            <p className="mt-1.5 text-sm leading-6 text-[#5d5b5a]">{text}</p>
                        </div>
                    ))}
                </section>

                {/* Stats */}
                <section className="pb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        ["98%", "teacher acceptance rate"],
                        ["30+", "hours saved per teacher / month"],
                        ["90%", "reduction in grading time"],
                        ["10%", "improvement in learning outcomes"],
                    ].map(([num, label]) => (
                        <div key={num} className="rounded-[20px] border border-[#ece3dc] bg-white/70 p-5 text-center">
                            <p className="text-3xl font-bold tracking-[-0.06em] text-[#ff5623]">{num}</p>
                            <p className="mt-2 text-xs leading-5 text-[#5d5b5a]">{label}</p>
                        </div>
                    ))}
                </section>

                {/* CTA */}
                <section className="pb-12">
                    <div className="rounded-[26px] border border-[#f7d8c8] bg-[#fff3ee] px-8 py-10 text-center">
                        <h2 className="text-2xl font-bold tracking-[-0.05em] text-[#1a1a1a]">
                            See how VedaAI works for your institution
                        </h2>
                        <p className="mx-auto mt-3 max-w-[400px] text-sm leading-6 text-[#5d5b5a]">
                            AI-powered grading that teachers trust, institutions afford, and students benefit from.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(loggedIn ? "/home" : "/login")}
                                className="rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#303030]"
                            >
                                {loggedIn ? "Open workspace" : "Get started free"}
                            </button>
                            <Link to="/calculator" className="rounded-full border border-[#e0cec7] bg-white px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f5f2]">
                                View pricing →
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#ece3dc] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1200px] flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <div className="flex items-center gap-2">
                        <img src={vedaLogo} alt="VedaAI logo" className="h-6 w-6 rounded-[6px] object-cover" />
                        <span className="text-sm font-bold tracking-[-0.04em]">VedaAI</span>
                    </div>
                    <p className="text-xs text-[#9a9693]">© 2024 Vedafy Technologies Pvt. Ltd.</p>
                    <div className="flex gap-4 text-xs text-[#5d5b5a]">
                        <a href="https://myvedaai.com/privacy-policy" className="hover:text-[#1a1a1a]">Privacy</a>
                        <a href="https://myvedaai.com/terms-of-services" className="hover:text-[#1a1a1a]">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}