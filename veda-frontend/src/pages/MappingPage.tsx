import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAnswerSheet,
  gradeAnswerSheet,
  patchGrade,
  assignRegion,
  getExam,
  type SplitViewPayload,
  type Question,
  type Grade,
  type AnswerRegion,
} from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSidebar } from "@/context/SidebarContext";


// ── Helpers ───────────────────────────────────────────────────────────────────

function markColor(grade?: Grade): string {
  if (!grade) return "bg-[#e8e8e8] text-[#6b6b6b]";
  if (grade.marksAwarded === 0) return "bg-red-100 text-red-700";
  if (grade.marksAwarded >= grade.maxMarks) return "bg-green-100 text-green-700";
  return "bg-orange-100 text-orange-700";
}

function pct(val: number, max: number) {
  if (!max) return 0;
  return Math.round((val / max) * 100);
}

// ── Canvas highlight ──────────────────────────────────────────────────────────

function drawHighlight(
  canvas: HTMLCanvasElement,
  regions: AnswerRegion[],
  pageIndex: number,
  grade?: Grade
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const VERTICAL_OFFSET = 0.12; // 12% downward vertical drag

  for (const region of regions) {
    for (const seg of region.segments) {
      if (seg.pageIndex !== pageIndex) continue;
      const { x, y, width, height } = seg.boundingBox;
      const adjustedY = Math.min(1 - Math.min(height, 0.95), Math.max(0, y + VERTICAL_OFFSET));
      const adjustedHeight = Math.min(height, 1 - adjustedY);

      const cx = x * canvas.width;
      const cy = adjustedY * canvas.height;
      const cw = width * canvas.width;
      const ch = adjustedHeight * canvas.height;

      let strokeColor = "#F97316";
      let fillColor = "rgba(249,115,22,0.12)";
      if (grade) {
        if (grade.marksAwarded >= grade.maxMarks) {
          strokeColor = "#22c55e"; fillColor = "rgba(34,197,94,0.12)";
        } else if (grade.marksAwarded === 0) {
          strokeColor = "#ef4444"; fillColor = "rgba(239,68,68,0.12)";
        }
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, ch, 16);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label tab
      const tabW = 48, tabH = 28, tabRadius = tabH / 2, tabOffsetX = 16;
      const tabX = cx + tabOffsetX;
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(tabX, cy);
      ctx.lineTo(tabX, cy - tabH + tabRadius);
      ctx.arc(tabX + tabRadius, cy - tabH + tabRadius, tabRadius, Math.PI, Math.PI * 1.5);
      ctx.lineTo(tabX + tabW - tabRadius, cy - tabH);
      ctx.arc(tabX + tabW - tabRadius, cy - tabH + tabRadius, tabRadius, Math.PI * 1.5, 0);
      ctx.lineTo(tabX + tabW, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 16px 'Bricolage Grotesque', sans-serif";
      ctx.fillText(`${region.questionRef ?? "?"}`, tabX + 12, cy - 8);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

interface PageImageProps {
  src: string;
  pageIndex: number;
  regions: AnswerRegion[];
  grade?: Grade;
}

function PageImage({ src, pageIndex, regions, grade }: PageImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  const redraw = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    if (img.complete && img.naturalWidth > 0) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawHighlight(canvas, regions, pageIndex, grade);
    }
  }, [regions, pageIndex, grade]);

  useEffect(() => {
    redraw();
  }, [redraw, loaded]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
      redraw();
    }
  }, [src, redraw]);

  return (
    <div className="relative w-full flex justify-center">
      {!loaded && (
        <div className="w-full aspect-[3/4] bg-[#f0f0f0] animate-pulse rounded-[8px]" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={`Answer sheet page ${pageIndex + 1}`}
        className={`w-full rounded-[8px] object-contain shadow-lg ${loaded ? "block" : "hidden"}`}
        onLoad={() => {
          setLoaded(true);
          redraw();
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ top: 0, left: 0 }}
      />
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  grade?: Grade;
  region?: AnswerRegion;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onSaveGrade: (gradeId: string, marks: number) => Promise<void>;
}

function QuestionCard({
  question,
  grade,
  region,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onSaveGrade,
}: QuestionCardProps) {
  const [editMarks, setEditMarks] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (grade) setEditMarks(String(grade.teacherOverride ?? grade.marksAwarded));
  }, [grade]);

  async function handleBlurOrEnter() {
    if (!grade) return;
    const val = parseFloat(editMarks);
    if (isNaN(val) || val < 0 || val > grade.maxMarks) return;
    if (val === (grade.teacherOverride ?? grade.marksAwarded)) return;
    setSavingGrade(true);
    try {
      await onSaveGrade(grade._id, val);
    } finally {
      setSavingGrade(false);
    }
  }

  const colorClass = markColor(grade);

  return (
    <div
      className={`bg-white rounded-[14px] p-4 transition-all border ${selected ? "border-[#FF5623] shadow-[0_0_0_2px_rgba(255,86,35,0.12)]" : "border-[#f0f0f0]"
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Question badge */}
        <div
          onClick={onSelect}
          className="w-7 h-7 rounded-full bg-[#2b2b2b] flex items-center justify-center text-white text-[12px] font-bold shrink-0 cursor-pointer"
        >
          {question.displayId}
        </div>

        {/* Question text */}
        <div
          onClick={onSelect}
          className={`flex-1 text-[13px] text-[#1a1a1a] cursor-pointer ${expanded ? "" : "line-clamp-2"}`}
        >
          {question.text}
        </div>

        {/* Marks badge */}
        <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
          {grade ? `${grade.teacherOverride ?? grade.marksAwarded}/${grade.maxMarks}` : `-/${question.maxMarks}`}
        </span>

        {/* Expand chevron */}
        <button
          onClick={onToggleExpand}
          className="text-[#9b9b9b] hover:text-[#1a1a1a] transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#f5f5f5] flex flex-col gap-3">
          {/* Extracted student answer */}
          {region && region.extractedText && (
            <div className="bg-[#f9f9f9] rounded-[10px] p-3 border border-[#ececec]">
              <p className="text-[11px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1">
                Student's Written Answer ({region.segments.length} segment{region.segments.length > 1 ? "s" : ""})
              </p>
              <p className="text-[12px] text-[#2b2b2b] whitespace-pre-wrap font-mono leading-relaxed">
                {region.extractedText}
              </p>
            </div>
          )}

          {grade && grade.aiFeedback && (
            <div>
              <p className="text-[11px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1">AI Feedback</p>
              <p className="text-[13px] text-[#303030] leading-relaxed">{grade.aiFeedback}</p>
            </div>
          )}
          {grade && (
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-[#6b6b6b]">Marks:</label>
              <input
                type="number"
                min={0}
                max={grade.maxMarks}
                step={0.5}
                value={editMarks}
                onChange={(e) => setEditMarks(e.target.value)}
                onBlur={handleBlurOrEnter}
                onKeyDown={(e) => e.key === "Enter" && handleBlurOrEnter()}
                className="w-16 h-7 px-2 text-[13px] border border-[#e0e0e0] rounded-[6px] outline-none focus:border-[#FF5623] transition-colors"
              />
              <span className="text-[12px] text-[#9b9b9b]">/ {grade.maxMarks}</span>
              {savingGrade && <span className="text-[11px] text-[#9b9b9b]">Saving...</span>}
            </div>
          )}
        </div>
      )}

      {/* Selected quick preview of answer if not expanded */}
      {selected && !expanded && region && region.extractedText && (
        <div className="mt-2 pt-2 border-t border-[#f5f5f5]">
          <p className="text-[11px] font-medium text-[#FF5623] mb-0.5">Answer on sheet (highlighted):</p>
          <p className="text-[12px] text-[#555] line-clamp-3 font-mono whitespace-pre-wrap">
            {region.extractedText}
          </p>
        </div>
      )}

      {/* No answer found */}
      {selected && !region && (
        <div className="mt-3 pt-3 border-t border-[#f5f5f5] text-[13px] text-[#9b9b9b] italic">
          No answer region found for this question.
        </div>
      )}
    </div>
  );
}

// ── Summary panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ summary }: { summary: NonNullable<SplitViewPayload["summary"]> }) {
  const p = summary.percentage;
  const color = p >= 75 ? "text-green-600" : p >= 40 ? "text-amber-600" : "text-red-600";
  const strokeColor = p >= 75 ? "#22c55e" : p >= 40 ? "#f59e0b" : "#ef4444";
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * (p / 100);

  return (
    <div className="bg-white rounded-[14px] p-5 border border-[#f0f0f0]">
      <p className="text-[13px] font-bold text-[#1a1a1a] mb-4">Summary</p>
      <div className="flex items-center gap-4 mb-4">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
          <text x="48" y="53" textAnchor="middle" className={`text-[14px] font-bold ${color}`} fill={strokeColor} fontSize="16" fontWeight="bold">
            {p.toFixed(0)}%
          </text>
        </svg>
        <div>
          <p className="text-[13px] font-bold text-[#1a1a1a]">{summary.totalScore} / {summary.maxScore}</p>
          <p className="text-[12px] text-[#6b6b6b] mt-1 leading-relaxed">{summary.overallFeedback}</p>
        </div>
      </div>
      {summary.strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-1">Strengths</p>
          <ul className="flex flex-col gap-1">
            {summary.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-[#303030]">
                <span className="text-green-500 mt-0.5">—</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.improvements.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Improvements</p>
          <ul className="flex flex-col gap-1">
            {summary.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-[#303030]">
                <span className="text-amber-500 mt-0.5">—</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MappingPage() {
  const SPLIT_PADDING = 12;
  const SPLIT_GAP = 12;
  const RESIZER_WIDTH = 8;
  const DEFAULT_QUESTION_PANEL_WIDTH = 340;
  const MIN_QUESTION_PANEL_WIDTH = 280;
  const MAX_QUESTION_PANEL_WIDTH = 560;
  const MIN_ANSWER_PANEL_WIDTH = 360;
  const { examId, sheetId } = useParams<{ examId: string; sheetId: string }>();
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const [payload, setPayload] = useState<SplitViewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState("");
  const [visiblePage, setVisiblePage] = useState(0);
  const [mobileView, setMobileView] = useState<"questions" | "sheet">("questions");
  const [questionPanelWidth, setQuestionPanelWidth] = useState(DEFAULT_QUESTION_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);
  const desktopScrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const resizeOffsetRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function getQuestionPanelBounds() {
    const splitViewWidth = splitViewRef.current?.getBoundingClientRect().width ?? 0;
    const availableMax = splitViewWidth > 0
      ? splitViewWidth - (SPLIT_PADDING * 2) - (SPLIT_GAP * 2) - RESIZER_WIDTH - MIN_ANSWER_PANEL_WIDTH
      : MAX_QUESTION_PANEL_WIDTH;
    return {
      min: MIN_QUESTION_PANEL_WIDTH,
      max: Math.max(MIN_QUESTION_PANEL_WIDTH, Math.min(MAX_QUESTION_PANEL_WIDTH, availableMax)),
    };
  }

  function clampQuestionPanelWidth(width: number) {
    const bounds = getQuestionPanelBounds();
    return Math.min(bounds.max, Math.max(bounds.min, width));
  }

  function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
    const dividerRect = event.currentTarget.getBoundingClientRect();
    resizeOffsetRef.current = event.clientX - (dividerRect.left + dividerRect.width / 2);
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
  }

  function handleResizeMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isResizing || !splitViewRef.current) return;
    const splitViewLeft = splitViewRef.current.getBoundingClientRect().left;
    const dividerCenterOffset = SPLIT_PADDING + SPLIT_GAP + RESIZER_WIDTH / 2;
    setQuestionPanelWidth(
      clampQuestionPanelWidth(event.clientX - splitViewLeft - dividerCenterOffset - resizeOffsetRef.current)
    );
  }

  function handleResizeEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsResizing(false);
  }

  function handleResizeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const bounds = getQuestionPanelBounds();
    const step = 16;
    let nextWidth: number | null = null;

    if (event.key === "ArrowLeft") nextWidth = questionPanelWidth - step;
    if (event.key === "ArrowRight") nextWidth = questionPanelWidth + step;
    if (event.key === "Home") nextWidth = bounds.min;
    if (event.key === "End") nextWidth = bounds.max;

    if (nextWidth !== null) {
      event.preventDefault();
      setQuestionPanelWidth(clampQuestionPanelWidth(nextWidth));
    }
  }

  useEffect(() => {
    if (!examId || !sheetId) return;
    getAnswerSheet(examId, sheetId)
      .then(setPayload)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [examId, sheetId]);

  // Poll if status is still processing
  useEffect(() => {
    if (!payload || payload.answerSheet.status !== "processing") return;
    if (!examId) return;

    pollRef.current = setInterval(() => {
      getExam(examId).then((data) => {
        if (data.status !== "processing") {
          if (pollRef.current) clearInterval(pollRef.current);
          getAnswerSheet(examId!, sheetId!).then(setPayload);
        }
      });
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [payload?.answerSheet.status, examId, sheetId]);

  function normalizeKey(k?: string | null): string {
    if (!k) return "";
    return k.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function findRegionForQuestion(q: Question): AnswerRegion | undefined {
    if (!payload) return undefined;
    const qIdNorm = normalizeKey(q._id);
    const qDispNorm = normalizeKey(q.displayId);
    const qNumNorm = normalizeKey(q.number);

    return payload.answerRegions.find((r) => {
      if (r.question && (r.question === q._id || normalizeKey(r.question) === qDispNorm || normalizeKey(r.question) === qNumNorm)) {
        return true;
      }
      const rRefNorm = normalizeKey(r.questionRef);
      if (!rRefNorm) return false;
      return (
        rRefNorm === qDispNorm ||
        rRefNorm === qNumNorm ||
        rRefNorm === qIdNorm ||
        rRefNorm === `q${qDispNorm}` ||
        rRefNorm === `q${qNumNorm}` ||
        `q${rRefNorm}` === qDispNorm ||
        `q${rRefNorm}` === qNumNorm ||
        rRefNorm === `t${qDispNorm}` ||
        rRefNorm === `t${qNumNorm}`
      );
    });
  }

  function findGradeForQuestion(q: Question): Grade | undefined {
    if (!payload) return undefined;
    const qIdNorm = normalizeKey(q._id);
    const qDispNorm = normalizeKey(q.displayId);
    const qNumNorm = normalizeKey(q.number);

    return payload.grades.find((g) => {
      const gNorm = normalizeKey(g.question);
      return (
        g.question === q._id ||
        gNorm === qDispNorm ||
        gNorm === qNumNorm ||
        gNorm === qIdNorm ||
        gNorm === `q${qDispNorm}` ||
        gNorm === `q${qNumNorm}` ||
        `q${gNorm}` === qDispNorm ||
        `q${gNorm}` === qNumNorm ||
        gNorm === `t${qDispNorm}` ||
        gNorm === `t${qNumNorm}`
      );
    });
  }

  // Auto-select first question if none selected
  const activeSelectedQId = selectedQId ?? payload?.questions[0]?._id;
  const selectedQ = payload?.questions.find((q) => q._id === activeSelectedQId || q.displayId === activeSelectedQId) || payload?.questions[0];
  const activeRegion = selectedQ ? findRegionForQuestion(selectedQ) : undefined;
  const activeRegions = activeRegion ? [activeRegion] : [];
  const activeGrade = selectedQ ? findGradeForQuestion(selectedQ) : undefined;

  const scrollToTarget = useCallback((targetPageIndex: number, relativeY?: number) => {
    const pageEl = pageRefs.current.get(targetPageIndex);
    if (!pageEl) return;
    const adjustedRelativeY = typeof relativeY === "number" ? Math.min(0.95, relativeY + 0.12) : 0;
    const yOffset = adjustedRelativeY * pageEl.offsetHeight;
    const targetTop = Math.max(0, pageEl.offsetTop + yOffset - 32);

    desktopScrollContainerRef.current?.scrollTo({ top: targetTop, behavior: "smooth" });
    mobileScrollContainerRef.current?.scrollTo({ top: targetTop, behavior: "smooth" });
    setVisiblePage(targetPageIndex);
  }, []);

  // Smoothly scroll to the page/position of the selected question's answer segment
  useEffect(() => {
    if (activeRegion && activeRegion.segments && activeRegion.segments.length > 0) {
      const firstSeg = activeRegion.segments[0];
      if (typeof firstSeg.pageIndex === "number" && firstSeg.pageIndex >= 0) {
        scrollToTarget(firstSeg.pageIndex, firstSeg.boundingBox?.y);
      }
    }
  }, [activeSelectedQId, activeRegion, scrollToTarget]);

  async function handleGrade() {
    if (!examId || !sheetId) return;
    setGrading(true);
    setGradingError("");
    try {
      await gradeAnswerSheet(examId, sheetId);
      // Reload full payload
      const fresh = await getAnswerSheet(examId, sheetId);
      setPayload(fresh);
    } catch (e) {
      setGradingError((e as Error).message);
    } finally {
      setGrading(false);
    }
  }

  async function handleSaveGrade(gradeId: string, marks: number) {
    if (!examId || !sheetId || !payload) return;
    const updated = await patchGrade(examId, sheetId, gradeId, marks);
    setPayload((prev) =>
      prev ? { ...prev, grades: prev.grades.map((g) => (g._id === gradeId ? updated : g)) } : prev
    );
  }

  async function handleAssignRegion(regionId: string, questionId: string) {
    if (!examId || !sheetId || !payload) return;
    const updated = await assignRegion(examId, sheetId, regionId, questionId);
    setPayload((prev) =>
      prev
        ? {
          ...prev,
          answerRegions: prev.answerRegions.map((r) => (r._id === regionId ? updated : r)),
        }
        : prev
    );
  }

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-b from-[#eee] to-[#dadada]">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon size={32} />
          <p className="text-[14px] text-[#6b6b6b]">Loading answer sheet...</p>
        </div>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-b from-[#eee] to-[#dadada]">
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-8 text-center max-w-sm">
          <p className="text-[15px] font-semibold text-red-700 mb-1">Failed to load</p>
          <p className="text-[13px] text-red-600">{error}</p>
          <button
            onClick={() => navigate("/exams")}
            className="mt-4 px-4 py-2 bg-[#303030] text-white rounded-[10px] text-[13px] font-semibold"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const { answerSheet, questions, summary } = payload;
  const pageImages = answerSheet.pageImages ?? [];
  const pageCount = pageImages.length;
  const isGraded = answerSheet.status === "graded";
  const isMapped = answerSheet.status === "mapped";

  return (
    <div className="flex size-full bg-gradient-to-b from-[#eee] to-[#dadada] overflow-hidden">
      {/* Shared sidebar - collapsed on desktop, drawer on mobile */}
      <div className="hidden h-full p-3 lg:flex">
        <Sidebar collapsed={!isOpen} onToggle={() => setIsOpen(!isOpen)} />
      </div>
      <div className="lg:hidden">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={<>{typeof answerSheet.exam === "object" ? answerSheet.exam.title : "Answer Sheet"}{answerSheet.student && <span className="ml-1 text-[#8c8c8c]">/ {answerSheet.student.name}</span>}</>}
          showBack
          mobileMenuOpen={() => setMobileOpen(true)}
          actions={
            <>
              {isMapped && (
                <button
                  onClick={handleGrade}
                  disabled={grading}
                  className="flex items-center gap-1.5 rounded-full bg-[#FF5623] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#e04e1f] disabled:opacity-60"
                >
                  {grading ? <><SpinnerIcon size={12} /> Grading...</> : "Grade this sheet"}
                </button>
              )}
              {gradingError && <span className="hidden text-[12px] text-red-600 sm:inline">{gradingError}</span>}
            </>
          }
        />

        <div className="lg:hidden px-3 pt-3">
          <div className="mx-auto flex w-full max-w-85 items-center rounded-full bg-white p-1 shadow-[inset_0_1px_1px_rgba(0,0,0,0.08)]">
            {([
              { key: "questions", label: "Questions" },
              { key: "sheet", label: "Answer Sheet" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileView(tab.key)}
                className={`flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${mobileView === tab.key
                  ? "bg-[#2c2c2c] text-white shadow-sm"
                  : "text-[#3b3b3b]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={splitViewRef}
          className={`hidden flex-1 lg:flex gap-3 p-3 overflow-hidden min-h-0 ${isResizing ? "select-none" : ""}`}
        >
          <div
            className="shrink-0 flex flex-col gap-3 overflow-hidden"
            style={{ width: questionPanelWidth }}
          >
            <div className="flex items-center justify-between bg-white/70 rounded-[14px] px-4 py-3 backdrop-blur">
              <p className="text-[13px] font-bold text-[#303030]">Extracted Questions</p>
              <span className="text-[11px] text-[#9b9b9b]">{questions.length} questions</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {questions.map((q) => (
                <QuestionCard
                  key={q._id}
                  question={q}
                  grade={findGradeForQuestion(q)}
                  region={findRegionForQuestion(q)}
                  selected={activeSelectedQId === q._id}
                  expanded={expandedQId === q._id}
                  onSelect={() => {
                    setSelectedQId(q._id);
                    setExpandedQId(q._id);
                  }}
                  onToggleExpand={() => {
                    setSelectedQId(q._id);
                    setExpandedQId((prev) => (prev === q._id ? null : q._id));
                  }}
                  onSaveGrade={handleSaveGrade}
                />
              ))}

              {summary && isGraded && <SummaryPanel summary={summary} />}
            </div>
          </div>

          <div
            role="separator"
            aria-label="Resize question and answer panels"
            aria-orientation="vertical"
            aria-valuemin={getQuestionPanelBounds().min}
            aria-valuemax={getQuestionPanelBounds().max}
            aria-valuenow={questionPanelWidth}
            tabIndex={0}
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            onKeyDown={handleResizeKeyDown}
            className={`group relative w-2 shrink-0 cursor-col-resize touch-none rounded-full outline-none transition-colors hover:bg-[#ff5623]/20 focus-visible:bg-[#ff5623]/20 ${isResizing ? "bg-[#ff5623]/20" : ""}`}
          >
            <span className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#bdbdbd] transition-colors group-hover:bg-[#ff5623] group-focus-visible:bg-[#ff5623]" />
          </div>

          <div className="flex-1 flex flex-col rounded-[20px] overflow-hidden bg-[#303030] min-w-0">
            <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/10 bg-[#2b2b2b]">
              <div className="flex items-center gap-2.5">
                <span className="text-white text-[13px] font-semibold">Answer Sheet</span>
                <span className="text-white/50 text-[11px] bg-white/10 px-2 py-0.5 rounded-full font-medium">
                  {pageCount} {pageCount === 1 ? "page" : "pages"} (Continuous)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {pageCount > 1 && (
                  <div className="flex items-center gap-1 bg-black/40 rounded-[8px] px-2 py-1 border border-white/10">
                    <button
                      onClick={() => scrollToTarget(Math.max(0, visiblePage - 1))}
                      disabled={visiblePage === 0}
                      className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                      title="Previous page"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span className="text-white/80 text-[12px] px-1 whitespace-nowrap font-medium">
                      Page {visiblePage + 1} of {pageCount}
                    </span>
                    <button
                      onClick={() => scrollToTarget(Math.min(pageCount - 1, visiblePage + 1))}
                      disabled={visiblePage === pageCount - 1}
                      className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                      title="Next page"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-black/40 rounded-[8px] px-2 py-1 border border-white/10">
                  <button
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    title="Zoom out"
                  >-</button>
                  <span className="text-white/80 text-[12px] w-9 text-center font-medium">{zoom}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(150, z + 10))}
                    className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    title="Zoom in"
                  >+</button>
                </div>
              </div>
            </div>

            <div
              ref={desktopScrollContainerRef}
              onScroll={(e) => {
                const container = e.currentTarget;
                const containerTop = container.scrollTop;
                const midPoint = containerTop + container.clientHeight / 3;
                for (let i = 0; i < pageCount; i++) {
                  const el = pageRefs.current.get(i);
                  if (el) {
                    const top = el.offsetTop;
                    const bottom = top + el.offsetHeight;
                    if (midPoint >= top && midPoint <= bottom) {
                      setVisiblePage(i);
                      break;
                    }
                  }
                }
              }}
              className="flex-1 overflow-y-auto overflow-x-auto bg-[#1e1e1e]/60 p-4 scroll-smooth"
            >
              {pageImages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/50 text-[14px]">
                  No page images available
                </div>
              ) : (
                <div
                  style={{
                    width: `${zoom}%`,
                    maxWidth: zoom > 100 ? `${(zoom / 100) * 880}px` : "880px",
                    margin: "0 auto",
                  }}
                  className="flex flex-col gap-0 items-center transition-all pb-12 shadow-2xl rounded-[10px] overflow-hidden"
                >
                  {pageImages.map((src, pageIndex) => (
                    <div
                      key={pageIndex}
                      ref={(el) => {
                        if (el) pageRefs.current.set(pageIndex, el);
                        else pageRefs.current.delete(pageIndex);
                      }}
                      className="w-full flex flex-col items-center bg-white border-b border-black/15 last:border-b-0"
                    >
                      <PageImage
                        src={src}
                        pageIndex={pageIndex}
                        regions={activeRegions}
                        grade={activeGrade}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden min-h-0 lg:hidden">
          {mobileView === "questions" ? (
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              <div className="flex items-center justify-between bg-white/70 rounded-[14px] px-4 py-3 backdrop-blur">
                <p className="text-[13px] font-bold text-[#303030]">Extracted Questions</p>
                <span className="text-[11px] text-[#9b9b9b]">{questions.length} questions</span>
              </div>

              {questions.map((q) => (
                <QuestionCard
                  key={q._id}
                  question={q}
                  grade={findGradeForQuestion(q)}
                  region={findRegionForQuestion(q)}
                  selected={activeSelectedQId === q._id}
                  expanded={expandedQId === q._id}
                  onSelect={() => {
                    setSelectedQId(q._id);
                    setExpandedQId(q._id);
                  }}
                  onToggleExpand={() => {
                    setSelectedQId(q._id);
                    setExpandedQId((prev) => (prev === q._id ? null : q._id));
                  }}
                  onSaveGrade={handleSaveGrade}
                />
              ))}

              {summary && isGraded && <SummaryPanel summary={summary} />}
            </div>
          ) : (
            <div className="flex-1 flex flex-col rounded-[18px] overflow-hidden bg-[#303030] min-w-0">
              <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10 bg-[#2b2b2b]">
                <div className="flex items-center gap-2">
                  <span className="text-white text-[13px] font-semibold">Answer Sheet</span>
                  <span className="text-white/50 text-[11px] bg-white/10 px-2 py-0.5 rounded-full">
                    {pageCount}p
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {pageCount > 1 && (
                    <div className="flex items-center gap-1 bg-black/40 rounded-[6px] px-1.5 py-0.5 text-white/80 text-[11px]">
                      <button
                        onClick={() => scrollToTarget(Math.max(0, visiblePage - 1))}
                        disabled={visiblePage === 0}
                        className="w-4 h-4 flex items-center justify-center disabled:opacity-30"
                      >
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <span>{visiblePage + 1}/{pageCount}</span>
                      <button
                        onClick={() => scrollToTarget(Math.min(pageCount - 1, visiblePage + 1))}
                        disabled={visiblePage === pageCount - 1}
                        className="w-4 h-4 flex items-center justify-center disabled:opacity-30"
                      >
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-black/40 rounded-[6px] px-1.5 py-0.5 text-white/80 text-[11px]">
                    <button
                      onClick={() => setZoom((z) => Math.max(50, z - 10))}
                      className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white"
                    >-</button>
                    <span className="w-7 text-center">{zoom}%</span>
                    <button
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                      className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white"
                    >+</button>
                  </div>
                </div>
              </div>

              <div
                ref={mobileScrollContainerRef}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const containerTop = container.scrollTop;
                  const midPoint = containerTop + container.clientHeight / 3;
                  for (let i = 0; i < pageCount; i++) {
                    const el = pageRefs.current.get(i);
                    if (el) {
                      const top = el.offsetTop;
                      const bottom = top + el.offsetHeight;
                      if (midPoint >= top && midPoint <= bottom) {
                        setVisiblePage(i);
                        break;
                      }
                    }
                  }
                }}
                className="flex-1 overflow-y-auto overflow-x-auto bg-[#1e1e1e]/60 p-3 scroll-smooth"
              >
                {pageImages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/50 text-[14px]">
                    No page images available
                  </div>
                ) : (
                  <div
                    style={{
                      width: `${zoom}%`,
                      margin: "0 auto",
                    }}
                    className="flex flex-col gap-0 items-center transition-all pb-8 rounded-[8px] overflow-hidden"
                  >
                    {pageImages.map((src, pageIndex) => (
                      <div
                        key={pageIndex}
                        ref={(el) => {
                          if (el) pageRefs.current.set(pageIndex, el);
                          else pageRefs.current.delete(pageIndex);
                        }}
                        className="w-full flex flex-col items-center bg-white border-b border-black/15 last:border-b-0"
                      >
                        <PageImage
                          src={src}
                          pageIndex={pageIndex}
                          regions={activeRegions}
                          grade={activeGrade}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
