import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import {
  getExams,
  getExamAssessment,
  type Exam,
  type ExamAssessment,
} from "@/lib/api";

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [assessment, setAssessment] = useState<ExamAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showGapsModal, setShowGapsModal] = useState<boolean>(false);
  const [showInsightsModal, setShowInsightsModal] = useState<boolean>(false);

  // Fetch all exams on mount
  useEffect(() => {
    setLoading(true);
    getExams()
      .then((examList) => {
        setExams(examList);
        if (examList.length > 0) {
          const target = examList.find((e) => e.status === "graded" || e.status === "ready") || examList[0];
          setSelectedExamId(target._id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load exams");
        setLoading(false);
      });
  }, []);

  // Fetch real-time assessment when selected exam changes
  useEffect(() => {
    if (!selectedExamId) return;

    setIsRefreshing(true);
    setError("");
    getExamAssessment(selectedExamId)
      .then((data) => {
        if (data) {
          setAssessment(data);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load assessment for this exam");
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, [selectedExamId]);

  return (
    <AppShell title="Assignments" showBack={false}>
      <div
        className="mx-auto w-full max-w-[1320px] pb-10"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        {/* ── Top Bar: Exam Selector & Realtime Indicator ──────────────────────── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold text-[#666666]">Exam:</span>
            {exams.length > 0 ? (
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="rounded-lg border border-[#d8d8d8] bg-white px-3 py-1.5 text-[13px] font-bold text-[#1f2937] shadow-sm outline-none transition hover:border-[#ff5623] focus:border-[#ff5623] focus:ring-1 focus:ring-[#ff5623]"
              >
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} {exam.subject ? `(${exam.subject})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[13px] font-bold text-[#1f2937]">
                No exams found
              </span>
            )}

            {isRefreshing && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#ff5623]">
                <SpinnerIcon size={12} /> Generating real-time AI analysis...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0fdf4] px-3 py-1 text-[11px] font-bold text-[#16a34a] border border-[#bbf7d0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Real-Time AI Sync
            </span>
          </div>
        </div>

        {/* ── Loading Skeleton State ────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-pulse">
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="h-6 w-48 mx-auto bg-gray-200 rounded-md" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="h-56 rounded-[22px] bg-gray-300 sm:col-span-5" />
                <div className="grid grid-cols-2 gap-6 sm:col-span-7 sm:pl-4">
                  <div className="h-20 bg-gray-200 rounded-xl" />
                  <div className="h-20 bg-gray-200 rounded-xl" />
                  <div className="h-20 bg-gray-200 rounded-xl" />
                  <div className="h-20 bg-gray-200 rounded-xl" />
                </div>
              </div>
              <div className="h-64 rounded-[28px] bg-gray-200" />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="h-72 rounded-[22px] bg-gray-200" />
              <div className="h-72 rounded-[22px] bg-gray-200" />
            </div>
          </div>
        )}

        {/* ── Empty State when no exams exist ──────────────────────────────── */}
        {!loading && exams.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d8d8d8] bg-white p-12 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe8e2] text-[#ff5623]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-[#1f2937]">No exams available</h3>
            <p className="mt-1.5 max-w-sm text-[13px] text-[#6b7280]">
              Create an exam and upload student answer sheets to generate real-time AI learning gap and performance assessments.
            </p>
            <button
              onClick={() => navigate("/exams")}
              className="mt-6 rounded-full bg-[#303030] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#1a1a1a]"
            >
              Go to Exams
            </button>
          </div>
        )}

        {/* ── Main Dashboard Layout ─────────────────────────────────────────── */}
        {!loading && assessment && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* ═════════════════════════════════════════════════════════════════════
                LEFT COLUMN: Assessment Summary & Student Segmentation (7 cols)
               ═════════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              {/* Assessment Summary Section Title */}
              <div className="text-center">
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1e293b] sm:text-[20px]">
                  Assessment Summary
                </h2>
              </div>

              {/* Top Row: Gauge Card + 2x2 Stats Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
                {/* Gauge Card (5 cols) */}
                <div className="flex flex-col items-center justify-center rounded-[22px] bg-[#1f2327] p-5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.12)] sm:col-span-5 sm:min-h-[220px]">
                  <p className="mb-2 text-[13px] font-semibold tracking-wide text-[#cbd5e1]">
                    Submissions
                  </p>

                  {/* Semicircle Gauge */}
                  <div className="relative flex items-center justify-center">
                    <GaugeArc
                      value={assessment.submissionCount}
                      max={assessment.totalStudents || assessment.submissionCount || 1}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <p className="text-[24px] font-black leading-none text-white sm:text-[26px]">
                        {assessment.submissionCount}
                        <span className="text-[13px] font-medium text-[#94a3b8]">
                          {" "}/ {assessment.totalStudents || assessment.submissionCount || 0}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-[#94a3b8]">
                        Submissions
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2x2 Metrics Grid (7 cols) */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:col-span-7 sm:pl-4">
                  {/* Average Score */}
                  <div className="flex flex-col">
                    <p className="text-[32px] font-black leading-none tracking-tight text-[#1e293b] sm:text-[38px]">
                      {assessment.submissionCount > 0 ? `${assessment.averageScore}%` : "—"}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#64748b]">
                      Average Score
                    </p>
                  </div>

                  {/* Top Score */}
                  <div className="flex flex-col">
                    <p className="text-[32px] font-black leading-none tracking-tight text-[#16a34a] sm:text-[38px]">
                      {assessment.submissionCount > 0 ? `${assessment.topScore}%` : "—"}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#64748b]">
                      Top Score
                    </p>
                  </div>

                  {/* Class Median */}
                  <div className="flex flex-col">
                    <p className="text-[32px] font-black leading-none tracking-tight text-[#1e293b] sm:text-[38px]">
                      {assessment.submissionCount > 0 ? (
                        <>
                          {assessment.classMedian}
                          <span className="text-[20px] font-bold text-[#64748b]">
                            /{assessment.totalMarks || 100}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#64748b]">
                      Class Median
                    </p>
                  </div>

                  {/* Lowest Score */}
                  <div className="flex flex-col">
                    <p className="text-[32px] font-black leading-none tracking-tight text-[#dc2626] sm:text-[38px]">
                      {assessment.submissionCount > 0 ? `${assessment.lowestScore}%` : "—"}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[#64748b]">
                      Lowest Score
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Student Segmentation Card */}
              <div className="rounded-[28px] border-[8px] border-[#555a60] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">
                <h3 className="mb-6 text-center text-[15px] font-extrabold tracking-tight text-[#1e293b] sm:text-[17px]">
                  Student Segmentation (Based on grades)
                </h3>

                <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                  {/* Grade A */}
                  <div className="flex min-h-[160px] flex-col items-center justify-between rounded-[18px] bg-gradient-to-b from-[#22c55e] to-[#16a34a] px-2 py-5 text-white shadow-md sm:min-h-[190px] sm:py-6">
                    <span className="text-[32px] font-black leading-none drop-shadow-sm sm:text-[40px]">
                      A
                    </span>
                    <div className="text-center">
                      <p className="text-[17px] font-black leading-none sm:text-[20px]">
                        {assessment.segmentation?.A ?? 0}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold opacity-95 sm:text-[12px]">
                        Students
                      </p>
                    </div>
                  </div>

                  {/* Grade B */}
                  <div className="flex min-h-[160px] flex-col items-center justify-between rounded-[18px] bg-gradient-to-b from-[#facc15] to-[#eab308] px-2 py-5 text-white shadow-md sm:min-h-[190px] sm:py-6">
                    <span className="text-[32px] font-black leading-none drop-shadow-sm sm:text-[40px]">
                      B
                    </span>
                    <div className="text-center">
                      <p className="text-[17px] font-black leading-none sm:text-[20px]">
                        {assessment.segmentation?.B ?? 0}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold opacity-95 sm:text-[12px]">
                        Students
                      </p>
                    </div>
                  </div>

                  {/* Grade C */}
                  <div className="flex min-h-[160px] flex-col items-center justify-between rounded-[18px] bg-gradient-to-b from-[#fb923c] to-[#f97316] px-2 py-5 text-white shadow-md sm:min-h-[190px] sm:py-6">
                    <span className="text-[32px] font-black leading-none drop-shadow-sm sm:text-[40px]">
                      C
                    </span>
                    <div className="text-center">
                      <p className="text-[17px] font-black leading-none sm:text-[20px]">
                        {assessment.segmentation?.C ?? 0}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold opacity-95 sm:text-[12px]">
                        Students
                      </p>
                    </div>
                  </div>

                  {/* Below D */}
                  <div className="flex min-h-[160px] flex-col items-center justify-between rounded-[18px] bg-gradient-to-b from-[#f87171] to-[#dc2626] px-2 py-5 text-white shadow-md sm:min-h-[190px] sm:py-6">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 sm:text-[11px]">
                        Below
                      </span>
                      <span className="text-[32px] font-black leading-none drop-shadow-sm sm:text-[40px]">
                        D
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[17px] font-black leading-none sm:text-[20px]">
                        {assessment.segmentation?.D ?? 0}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold opacity-95 sm:text-[12px]">
                        Students
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════
                RIGHT COLUMN: Learning Gap Analysis & Insights for Teachers (5 cols)
               ═════════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              {/* 1. Learning Gap Analysis */}
              <div className="rounded-[22px] border border-white/90 bg-white/75 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-extrabold text-[#1e293b] sm:text-[16px]">
                    Learning Gap Analysis
                  </h3>
                  {assessment.learningGaps && assessment.learningGaps.length > 5 && (
                    <button
                      onClick={() => setShowGapsModal(true)}
                      className="rounded-full bg-[#ffe8e2] px-3.5 py-1 text-[12px] font-bold text-[#ff5623] transition-all hover:bg-[#ffd5cb] active:scale-95"
                    >
                      View All
                    </button>
                  )}
                </div>

                {assessment.learningGaps && assessment.learningGaps.length > 0 ? (
                  <div className="flex flex-col divide-y divide-[#f1f5f9]">
                    {assessment.learningGaps.slice(0, 5).map((gap, idx) => (
                      <div key={idx} className="flex flex-col py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-bold text-[#1e293b] sm:text-[14px]">
                            {idx + 1}. {gap.topic}
                          </span>
                          <span className="shrink-0 text-[13px] font-black text-[#dc2626] sm:text-[14px]">
                            {gap.gapPercent}%
                          </span>
                        </div>
                        {/* Red indicator bar */}
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff7a50] to-[#ff5623]"
                            style={{ width: `${Math.min(100, Math.max(8, gap.gapPercent * 2.8))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-[13px] text-[#94a3b8]">
                    No learning gaps detected yet.
                  </p>
                )}
              </div>

              {/* 2. Insights for Teachers */}
              <div className="rounded-[22px] border border-white/90 bg-white/75 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-extrabold text-[#1e293b] sm:text-[16px]">
                    Insights for Teachers
                  </h3>
                  {assessment.teacherInsights && assessment.teacherInsights.length > 5 && (
                    <button
                      onClick={() => setShowInsightsModal(true)}
                      className="rounded-full bg-[#ffe8e2] px-3.5 py-1 text-[12px] font-bold text-[#ff5623] transition-all hover:bg-[#ffd5cb] active:scale-95"
                    >
                      View All
                    </button>
                  )}
                </div>

                {assessment.teacherInsights && assessment.teacherInsights.length > 0 ? (
                  <div className="flex flex-col gap-3.5">
                    {assessment.teacherInsights.slice(0, 5).map((insight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-[#334155] sm:text-[13.5px]"
                      >
                        <span className="shrink-0 font-extrabold text-[#1e293b]">
                          {idx + 1}.
                        </span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-[13px] text-[#94a3b8]">
                    No teacher insights generated yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals for View All ──────────────────────────────────────────────── */}
      {showGapsModal && assessment && (
        <Modal
          title="All Learning Gaps"
          onClose={() => setShowGapsModal(false)}
        >
          <div className="flex flex-col divide-y divide-[#f1f5f9]">
            {assessment.learningGaps?.map((gap, idx) => (
              <div key={idx} className="flex flex-col py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-bold text-[#1e293b]">
                    {idx + 1}. {gap.topic}
                  </span>
                  <span className="text-[14px] font-black text-[#dc2626]">
                    {gap.gapPercent}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div
                    className="h-full rounded-full bg-[#ff5623]"
                    style={{ width: `${Math.min(100, Math.max(8, gap.gapPercent * 2.8))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showInsightsModal && assessment && (
        <Modal
          title="All Teacher Insights"
          onClose={() => setShowInsightsModal(false)}
        >
          <div className="flex flex-col gap-4">
            {assessment.teacherInsights?.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#334155]">
                <span className="font-extrabold text-[#ff5623]">{idx + 1}.</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

// ── Semicircle Gauge SVG Component ─────────────────────────────────────────────

function GaugeArc({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const radius = 68;
  const strokeWidth = 14;
  const center = 85;

  // Arc calculations for a 180-degree top semicircle
  const totalLength = Math.PI * radius;
  const strokeDashoffset = totalLength * (1 - percent);

  return (
    <svg width="170" height="95" viewBox="0 0 170 95" className="overflow-visible">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff7a50" />
          <stop offset="50%" stopColor="#ff5623" />
          <stop offset="100%" stopColor="#e84010" />
        </linearGradient>
      </defs>

      {/* Background Track Arc */}
      <path
        d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
        fill="none"
        stroke="#33383f"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Foreground Active Arc */}
      <path
        d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={totalLength}
        strokeDashoffset={strokeDashoffset}
        style={{
          transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </svg>
  );
}

// ── Generic Reusable Modal Component ──────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[22px] bg-white p-6 shadow-2xl"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <h3 className="text-[17px] font-extrabold text-[#1e293b]">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto pr-1">{children}</div>
        <div className="mt-4 flex justify-end border-t border-[#f1f5f9] pt-3">
          <button
            onClick={onClose}
            className="rounded-full bg-[#1e293b] px-5 py-1.5 text-[13px] font-bold text-white transition hover:bg-[#0f172a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}


