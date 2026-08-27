import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { getExams, createExam, type Exam, type CreateExamBody } from "@/lib/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-[#f0f0f0] text-[#6b6b6b]" },
  processing: { label: "Processing", color: "bg-amber-50 text-amber-700" },
  ready: { label: "Ready", color: "bg-blue-50 text-blue-700" },
  graded: { label: "Graded", color: "bg-green-50 text-green-700" },
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExamsListPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getExams()
      .then(setExams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleExamClick(exam: Exam) {
    navigate(`/exams/${exam._id}`);
  }

  return (
    <AppShell title="Exams">
      <div className="max-w-[900px] mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#1a1a1a]">My Exams</h1>
            <p className="text-[13px] text-[#6b6b6b] mt-0.5">Upload and grade student answer sheets</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#303030] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#1a1a1a] active:scale-[0.98] transition-all"
          >
            <span className="text-lg leading-none">+</span>
            New Exam
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-[#9b9b9b] text-[14px]">
            <SpinnerIcon className="mr-2" /> Loading exams…
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] px-5 py-4 text-[14px] text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && exams.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="2" width="16" height="20" rx="2.5" stroke="#b0b0b0" strokeWidth="1.5" />
                <path d="M8 8H16M8 12H16M8 16H12" stroke="#b0b0b0" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#1a1a1a]">No exams yet</p>
            <p className="text-[13px] text-[#9b9b9b] mt-1">Create your first exam to get started</p>
          </div>
        )}

        {/* Exam grid */}
        {!loading && !error && exams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const status = STATUS_LABELS[exam.status] ?? STATUS_LABELS.draft;
              const sheetCount = exam.answerSheets?.length ?? 0;
              return (
                <button
                  key={exam._id}
                  onClick={() => handleExamClick(exam)}
                  className="text-left bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all border border-transparent hover:border-[#e8e8e8]"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-[15px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2">
                      {exam.title}
                    </h3>
                    <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {exam.subject && (
                      <span className="text-[13px] text-[#6b6b6b]">
                        <span className="font-medium text-[#1a1a1a]">{exam.subject}</span>
                        {exam.totalMarks ? ` · ${exam.totalMarks} marks` : ""}
                      </span>
                    )}
                    <span className="text-[12px] text-[#9b9b9b]">
                      {sheetCount > 0 ? `${sheetCount} answer sheet${sheetCount !== 1 ? "s" : ""}` : "No answer sheets yet"}
                      {exam.createdAt ? ` · ${formatDate(exam.createdAt)}` : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New Exam Modal */}
      {showModal && (
        <NewExamModal
          onClose={() => setShowModal(false)}
          onCreate={(exam) => {
            setExams((prev) => [exam, ...prev]);
            setShowModal(false);
            navigate(`/exams/${exam._id}`);
          }}
        />
      )}
    </AppShell>
  );
}

interface NewExamModalProps {
  onClose: () => void;
  onCreate: (exam: Exam) => void;
}

function NewExamModal({ onClose, onCreate }: NewExamModalProps) {
  const [form, setForm] = useState<CreateExamBody>({ title: "", subject: "", totalMarks: 50 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const exam = await createExam({ ...form, title: form.title.trim() });
      onCreate(exam);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[20px] shadow-2xl p-7 w-full max-w-[440px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold text-[#1a1a1a]">New Exam</h2>
          <button onClick={onClose} className="text-[#9b9b9b] hover:text-[#1a1a1a] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Title *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Class 10 Biology Midterm"
              className="input-base"
            />
          </Field>
          <Field label="Subject">
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Biology"
              className="input-base"
            />
          </Field>
          <Field label="Total Marks">
            <input
              type="number"
              min={1}
              value={form.totalMarks}
              onChange={(e) => setForm((f) => ({ ...f, totalMarks: Number(e.target.value) }))}
              className="input-base"
            />
          </Field>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-[10px] border border-[#e0e0e0] text-[14px] font-medium text-[#6b6b6b] hover:bg-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 h-10 rounded-[10px] bg-[#303030] text-white text-[14px] font-semibold hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><SpinnerIcon className="" /> Creating…</> : "Create Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#1a1a1a]">{label}</label>
      {children}
    </div>
  );
}

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`animate-spin ${className}`}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
