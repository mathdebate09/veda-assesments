import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { getClassroom, type ClassroomDetail, type Exam } from "@/lib/api";

type Tab = "students" | "exams";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-[#f0f0f0] text-[#6b6b6b]" },
  processing: { label: "Processing", color: "bg-amber-50 text-amber-700" },
  ready: { label: "Ready", color: "bg-blue-50 text-blue-700" },
  graded: { label: "Graded", color: "bg-green-50 text-green-700" },
};

export default function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("students");

  useEffect(() => {
    if (!id) return;
    getClassroom(id)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleExamClick(exam: Exam) {
    const sheetRef = exam.answerSheets?.[0];
    const sheetId = typeof sheetRef === "string" ? sheetRef : sheetRef?._id;
    if (exam.status === "graded" && sheetId) {
      navigate(`/exams/${exam._id}/answer-sheets/${sheetId}/mapping`);
    } else {
      navigate(`/exams/${exam._id}/upload`);
    }
  }

  return (
    <AppShell title={detail?.name ?? "Classroom"}>
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/classrooms")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors text-[#6b6b6b]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-[#1a1a1a]">{detail?.name ?? "…"}</h1>
            {detail && (detail.standard || detail.subject) && (
              <p className="text-[13px] text-[#6b6b6b] mt-0.5">
                {[detail.standard, detail.subject].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-[#9b9b9b] text-[14px]">
            <SpinnerIcon /> <span className="ml-2">Loading…</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] px-5 py-4 text-[14px] text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && detail && (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 bg-white/60 backdrop-blur p-1 rounded-[12px] w-fit mb-5">
              {(["students", "exams"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-colors capitalize ${
                    tab === t
                      ? "bg-[#303030] text-white shadow-sm"
                      : "text-[#6b6b6b] hover:text-[#1a1a1a]"
                  }`}
                >
                  {t === "students"
                    ? `Students (${detail.students.length})`
                    : `Exams (${detail.exams.length})`}
                </button>
              ))}
            </div>

            {/* Students tab */}
            {tab === "students" && (
              <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                {detail.students.length === 0 ? (
                  <div className="py-12 text-center text-[14px] text-[#9b9b9b]">No students in this classroom</div>
                ) : (
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="border-b border-[#f0f0f0]">
                        <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#9b9b9b] uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#9b9b9b] uppercase tracking-wide">Name</th>
                        <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#9b9b9b] uppercase tracking-wide">Roll No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.students.map((s, i) => (
                        <tr key={s._id} className="border-b border-[#f9f9f9] hover:bg-[#fafafa] transition-colors">
                          <td className="px-5 py-3.5 text-[#9b9b9b]">{i + 1}</td>
                          <td className="px-5 py-3.5 font-medium text-[#1a1a1a]">{s.name}</td>
                          <td className="px-5 py-3.5 text-[#6b6b6b]">{s.rollNo ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Exams tab */}
            {tab === "exams" && (
              <div className="flex flex-col gap-3">
                {detail.exams.length === 0 ? (
                  <div className="bg-white rounded-[16px] py-12 text-center text-[14px] text-[#9b9b9b] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    No exams for this classroom
                  </div>
                ) : (
                  detail.exams.map((exam) => {
                    const status = STATUS_LABELS[exam.status] ?? STATUS_LABELS.draft;
                    return (
                      <button
                        key={exam._id}
                        onClick={() => handleExamClick(exam)}
                        className="text-left bg-white rounded-[14px] px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-[14px] font-semibold text-[#1a1a1a]">{exam.title}</p>
                          <p className="text-[12px] text-[#9b9b9b] mt-0.5">
                            {exam.subject}
                            {exam.totalMarks ? ` · ${exam.totalMarks} marks` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="#9b9b9b" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#9b9b9b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
