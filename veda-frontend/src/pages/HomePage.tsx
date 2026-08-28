import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { getClassrooms, getExams, type Classroom, type Exam } from "@/lib/api";
import { useSidebar } from "@/context/SidebarContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { userInfo } = useSidebar();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getExams().then(setExams).catch(() => undefined),
      getClassrooms().then(setClassrooms).catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, []);

  const readyExams = exams.filter((exam) => exam.status === "ready" || exam.status === "graded").length;
  const answerSheets = exams.reduce((total, exam) => total + (exam.answerSheets?.length ?? 0), 0);
  const firstName = userInfo.name.split(" ")[0] || userInfo.name;

  return (
    <AppShell title="Home" showBack={false}>
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-5">
        <section className="relative overflow-hidden rounded-[22px] bg-[#303030] px-6 py-7 text-white shadow-[0_8px_28px_rgba(37,32,29,0.12)] sm:px-8 sm:py-9">
          <div className="relative z-10 max-w-[590px]">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#ffb49d]">Teacher workspace</p>
            <h1 className="text-[28px] font-bold leading-tight sm:text-[34px]">Good to see you, {firstName}.</h1>
            <p className="mt-2 max-w-[480px] text-[14px] leading-relaxed text-[#d7d7d7]">
              Keep your classrooms moving and turn student answer sheets into useful feedback.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/exams")}
                className="flex items-center gap-2 rounded-full bg-[#FF5623] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#e84d1f]"
              >
                Open exams
                <ArrowIcon />
              </button>
              <button
                type="button"
                onClick={() => navigate("/classrooms")}
                className="rounded-full border border-white/25 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                View classrooms
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-20" style={{ backgroundImage: "linear-gradient(135deg, transparent 48%, #ffffff 49%, transparent 50%), linear-gradient(45deg, transparent 48%, #ff5623 49%, transparent 50%)", backgroundSize: "42px 42px" }} />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total exams" value={loading ? "-" : exams.length.toString()} accent="text-[#FF5623]" />
          <Metric label="Ready to review" value={loading ? "-" : readyExams.toString()} accent="text-[#2e7d5b]" />
          <Metric label="Answer sheets" value={loading ? "-" : answerSheets.toString()} accent="text-[#3867a8]" />
          <Metric label="Classrooms" value={loading ? "-" : classrooms.length.toString()} accent="text-[#8a5a2b]" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[18px] border border-white bg-white/75 p-5 shadow-[0_4px_18px_rgba(37,32,29,0.05)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-bold text-[#1a1a1a]">Recent exams</h2>
                <p className="mt-0.5 text-[12px] text-[#8c8c8c]">Your latest assessment work</p>
              </div>
              <button type="button" onClick={() => navigate("/exams")} className="text-[12px] font-semibold text-[#FF5623] hover:text-[#d9431b]">View all</button>
            </div>

            {loading && <p className="py-8 text-center text-[13px] text-[#9b9b9b]">Loading activity...</p>}
            {!loading && exams.length === 0 && (
              <div className="rounded-[12px] bg-[#f8f8f8] px-4 py-8 text-center">
                <p className="text-[14px] font-semibold text-[#303030]">No exams yet</p>
                <p className="mt-1 text-[12px] text-[#9b9b9b]">Create an exam to start grading answer sheets.</p>
              </div>
            )}
            {!loading && exams.length > 0 && (
              <div className="flex flex-col divide-y divide-[#eeeeee]">
                {exams.slice(0, 4).map((exam) => (
                  <button key={exam._id} type="button" onClick={() => navigate(`/exams/${exam._id}`)} className="flex items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-[#303030]">{exam.title}</span>
                      <span className="mt-0.5 block text-[12px] text-[#9b9b9b]">{exam.subject || "General assessment"}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${exam.status === "graded" ? "bg-green-50 text-green-700" : exam.status === "ready" ? "bg-blue-50 text-blue-700" : "bg-[#f2f2f2] text-[#6b6b6b]"}`}>
                      {exam.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[18px] bg-[#fff3ee] p-5 shadow-[0_4px_18px_rgba(255,86,35,0.08)] sm:p-6">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-[#FF5623]">
              <SparkIcon />
            </div>
            <h2 className="text-[18px] font-bold text-[#303030]">AI Teacher's Toolkit</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#7d625a]">Build a calmer assessment workflow with your classroom data in one place.</p>
            <button type="button" onClick={() => navigate("/assignments")} className="mt-6 text-[13px] font-bold text-[#303030] hover:text-[#FF5623]">Explore toolkit <ArrowIcon dark /></button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-[16px] border border-white bg-white/75 px-4 py-4 shadow-[0_3px_14px_rgba(37,32,29,0.04)]">
      <p className={`text-[24px] font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] font-medium text-[#8c8c8c]">{label}</p>
    </div>
  );
}

function ArrowIcon({ dark = false }: { dark?: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M9 4L13 8L9 12" stroke={dark ? "#303030" : "white"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SparkIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C10.4 7.4 12.6 9.6 18 10C12.6 10.4 10.4 12.6 10 18C9.6 12.6 7.4 10.4 2 10C7.4 9.6 9.6 7.4 10 2Z" fill="currentColor" /><path d="M4 2.5C4.15 4.35 4.65 4.85 6.5 5C4.65 5.15 4.15 5.65 4 7.5C3.85 5.65 3.35 5.15 1.5 5C3.35 4.85 3.85 4.35 4 2.5Z" fill="currentColor" /></svg>;
}
