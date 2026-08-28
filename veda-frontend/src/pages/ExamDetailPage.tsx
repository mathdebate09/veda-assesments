import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getExam,
  getAnswerSheets,
  uploadQuestionPaper,
  uploadAnswerSheet,
  type ExamDetail,
  type AnswerSheet,
} from "@/lib/api";
import { convertFileToPngList } from "@/lib/pdfToImages";
import mappingGraphic from "@/assets/graphics/mapping.png";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSidebar } from "@/context/SidebarContext";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_BYTES = 25 * 1024 * 1024;

function validateFile(file: File): string | undefined {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Only PDF, PNG, or JPEG files are accepted.";
  if (file.size > MAX_BYTES) return "File exceeds the 25 MB limit.";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string | Date) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SHEET_STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  processing: { label: "Processing", color: "text-amber-700 bg-amber-50 border-amber-200", badge: "bg-amber-500" },
  mapped: { label: "Ready to Grade", color: "text-blue-700 bg-blue-50 border-blue-200", badge: "bg-blue-500" },
  graded: { label: "Graded", color: "text-green-700 bg-green-50 border-green-200", badge: "bg-green-500" },
};

export default function ExamDetailPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Files & inputs
  const [qpFile, setQpFile] = useState<File | null>(null);
  const [qpError, setQpError] = useState<string | undefined>();
  const [asFile, setAsFile] = useState<File | null>(null);
  const [asError, setAsError] = useState<string | undefined>();
  const [serialNo, setSerialNo] = useState("");
  const [studentName, setStudentName] = useState("");

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Previous mappings
  const [previousSheets, setPreviousSheets] = useState<AnswerSheet[]>([]);
  const [showPreviousModal, setShowPreviousModal] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const asInputRef = useRef<HTMLInputElement>(null);

  // Fetch exam & answer sheets
  async function loadData() {
    if (!examId) return;
    try {
      const data = await getExam(examId);
      setExam(data);

      const sheets = await getAnswerSheets(examId).catch(() => []);
      setPreviousSheets(sheets);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load exam.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [examId]);

  async function openPreviousMappings() {
    setShowPreviousModal(true);
    if (examId) {
      setLoadingPrevious(true);
      try {
        const sheets = await getAnswerSheets(examId);
        setPreviousSheets(sheets);
      } catch {/* ignore */ }
      finally {
        setLoadingPrevious(false);
      }
    }
  }

  function handleQpFilePick(file: File) {
    setQpError(validateFile(file));
    setQpFile(file);
  }

  function handleAsFilePick(file: File) {
    setAsError(validateFile(file));
    setAsFile(file);
  }

  const hasExistingQPaper = !!exam?.questionPaperUrl || (exam?.questionPaperPageImages?.length ?? 0) > 0;
  const isQpReady = hasExistingQPaper || (!!qpFile && !qpError);
  const isAsReady = !!asFile && !asError;
  const isSerialReady = !!serialNo.trim();
  const canStart = isQpReady && isAsReady && isSerialReady && !submitting;

  async function handleStartMapping() {
    if (!examId || !canStart) return;

    setSubmitting(true);
    setProgressText("Preparing documents…");
    setSubmitError("");

    try {
      // 1. Convert and upload question paper if newly chosen
      if (qpFile) {
        setProgressText("Converting Question Paper PDF to PNG…");
        const qpPages = await convertFileToPngList(qpFile, (msg) => setProgressText(msg));
        setProgressText("Uploading Question Paper to DeepSeek Vision…");
        await uploadQuestionPaper(examId, qpPages);
      }

      // 2. Convert and upload answer sheet
      setProgressText("Converting Answer Sheet PDF to PNG…");
      const asPages = await convertFileToPngList(asFile!, (msg) => setProgressText(msg));
      setProgressText("Uploading Answer Sheet to DeepSeek Vision…");
      const result = await uploadAnswerSheet(
        examId,
        serialNo.trim(),
        studentName.trim() || undefined,
        asPages
      );

      const sheetId =
        result?.answerSheet?._id ||
        result?.answerSheetId ||
        (Array.isArray(result) ? result[0]?.answerSheetId || result[0]?.answerSheet?._id : undefined);

      if (sheetId) {
        navigate(`/exams/${examId}/answer-sheets/${sheetId}/mapping`);
      } else {
        navigate(`/exams/${examId}`);
      }
    } catch (e) {
      setSubmitError((e as Error).message ?? "Mapping failed. Please check inputs and try again.");
      setSubmitting(false);
      setProgressText("");
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f2f1] text-[#252525]">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon size={32} />
          <p className="text-[14px] text-[#6b6b6b]">Loading exam details…</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f2f1] text-[#252525]">
        <div className="max-w-sm rounded-xl border border-[#f2cfc5] bg-[#fffaf8] p-8 text-center shadow-[0_12px_30px_rgba(37,37,37,0.06)]">
          <p className="text-[15px] font-semibold text-red-700 mb-1">Failed to load exam</p>
          <p className="text-[13px] text-red-600 mb-4">{error || "Exam not found."}</p>
          <button
            onClick={() => navigate("/exams")}
            className="px-4 py-2 bg-[#303030] text-white rounded-[10px] text-[13px] font-semibold"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f3f2f1] text-[#252525]">
      {/* Shared sidebar */}
      <div className="hidden h-full p-3 lg:flex">
        <Sidebar collapsed={!isOpen} onToggle={() => setIsOpen(!isOpen)} />
      </div>
      <div className="lg:hidden">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar
          title={<>{exam.title}{exam.subject && <span className="ml-1 text-[13px] text-[#8c8c8c]">({exam.subject})</span>}</>}
          showBack
          mobileMenuOpen={() => setMobileOpen(true)}
          actions={
            <button
              onClick={openPreviousMappings}
              className="hidden items-center gap-2 rounded-full border border-[#d8d8d8] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#303030] shadow-sm transition-all hover:bg-[#fafafa] hover:shadow sm:flex"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 4H13.5M2.5 8H13.5M2.5 12H9.5" stroke="#FF5623" strokeWidth="1.8" strokeLinecap="round" /></svg>
              Previous Mappings
              {previousSheets.length > 0 && <span className="rounded-full bg-[#FF5623] px-1.5 py-0.2 text-[11px] font-bold text-white">{previousSheets.length}</span>}
            </button>
          }
        />

        {/* Content Body */}
        <main className="mx-auto flex w-full max-w-245 flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          {/* Header Title */}
          <div className="mb-1 text-center">
            <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[28px] font-bold leading-tight tracking-[-0.04em] text-[#252525] sm:text-[34px]">
              <span>Upload</span>
              <span className="inline-block rounded-[7px] bg-[#ffe3da] px-2.5 py-0.5 font-bold text-[#ff5623] sm:px-3">
                Question Paper & Answer Sheets
              </span>
            </h1>
            <p className="mt-2 text-[14px] text-[#6f6c6a] sm:text-[15px]">
              Upload both files to get started
            </p>
          </div>

          {/* Central Graphic */}
          <div className="my-4 flex justify-center sm:my-5">
            <img
              src={mappingGraphic}
              alt="Teacher Illustration"
              className="h-28 w-28 select-none object-contain drop-shadow-[0_7px_10px_rgba(255,86,35,0.08)] pointer-events-none sm:h-32 sm:w-32"
            />
          </div>

          {/* Upload Cards Box */}
          <div className="flex w-full flex-col gap-4 rounded-[18px] border border-white/90 bg-white/65 p-4 shadow-[0_10px_28px_rgba(37,37,37,0.045)] backdrop-blur-md sm:p-5">
            {/* Two Side-by-Side Upload Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Question Paper Card */}
              <UploadCard
                label="Question Paper"
                hint="Max 25MB"
                file={qpFile}
                error={qpError}
                inputRef={qpInputRef}
                existingUploaded={hasExistingQPaper && !qpFile}
                existingText="Question Paper Uploaded"
                onFilePicked={handleQpFilePick}
                onRemove={() => { setQpFile(null); setQpError(undefined); }}
              />

              {/* Answer Sheet Card */}
              <UploadCard
                label="Answer Sheet"
                hint="Max 25MB"
                file={asFile}
                error={asError}
                inputRef={asInputRef}
                onFilePicked={handleAsFilePick}
                onRemove={() => { setAsFile(null); setAsError(undefined); }}
              />
            </div>

            {/* Student Info Inputs */}
            <div className="grid grid-cols-1 gap-4 border-t border-[#ece8e6] pt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5e5a58]">
                  Serial Number <span className="text-[#FF5623]">*</span>
                </label>
                <input
                  type="text"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="e.g. 001, 10B-01"
                  className="h-11 rounded-[9px] border border-[#d9d5d2] bg-white px-3.5 text-[14px] text-[#252525] outline-none transition-all placeholder:text-[#aaa5a1] focus:border-[#ff5623] focus:ring-2 focus:ring-[#ff5623]/10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5e5a58]">
                  Student Name <span className="text-[#9b9b9b] font-normal normal-case">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-11 rounded-[9px] border border-[#d9d5d2] bg-white px-3.5 text-[14px] text-[#252525] outline-none transition-all placeholder:text-[#aaa5a1] focus:border-[#ff5623] focus:ring-2 focus:ring-[#ff5623]/10"
                />
              </div>
            </div>

          </div>

          {submitError && (
            <div className="mt-4 w-full rounded-[9px] border border-[#f2cfc5] bg-[#fff5f1] px-4 py-3 text-[13px] text-red-600">
              {submitError}
            </div>
          )}

          {/* Action CTA */}
          <div className="flex flex-col items-center gap-2 pt-5">
            <button
              onClick={handleStartMapping}
              disabled={!canStart}
              className="flex items-center gap-2.5 rounded-full bg-[#303030] px-7 py-3 text-[14px] font-semibold text-white shadow-[0_5px_12px_rgba(48,48,48,0.18)] transition-all hover:bg-[#1a1a1a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {submitting ? (
                <>
                  <SpinnerIcon size={16} />
                  <span>{progressText || "Processing Document & Answers…"}</span>
                </>
              ) : (
                <>
                  <span>Start Mapping</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M9 4L13 8L9 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-[12px] text-[#8c8885]">
              Once both files are uploaded, you'll be able to map answers with questions
            </p>
          </div>
        </main>
      </div>

      {/* Previous Mappings Modal */}
      {showPreviousModal && (
        <PreviousMappingsModal
          examId={examId!}
          sheets={previousSheets}
          loading={loadingPrevious}
          onClose={() => setShowPreviousModal(false)}
        />
      )}
    </div>
  );
}

// ── Upload Card Component ──────────────────────────────────────────────────────

interface UploadCardProps {
  label: string;
  hint: string;
  file: File | null;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  existingUploaded?: boolean;
  existingText?: string;
  onFilePicked: (file: File) => void;
  onRemove: () => void;
}

function UploadCard({
  label,
  hint,
  file,
  error,
  inputRef,
  existingUploaded,
  existingText,
  onFilePicked,
  onRemove,
}: UploadCardProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFilePicked(dropped);
      }}
      onClick={() => {
        if (!file) inputRef.current?.click();
      }}
      className={`relative flex min-h-34 flex-col items-center justify-center rounded-[14px] border-2 border-dashed p-4 transition-all ${dragging
        ? "scale-[1.01] border-[#ff5623] bg-[rgba(255,86,35,0.06)]"
        : error
          ? "border-red-300 bg-[#fff7f5]"
          : file
            ? "border-[#ddd8d5] bg-white shadow-[0_3px_10px_rgba(37,37,37,0.04)]"
            : existingUploaded
              ? "cursor-pointer border-green-300 bg-green-50/50 hover:border-green-400"
              : "cursor-pointer border-[#d6d1ce] bg-white/75 hover:border-[#b7b0ac] hover:bg-white"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onFilePicked(picked);
        }}
      />

      {file ? (
        <div className="flex w-full items-center gap-3.5">
          <div className="flex h-12 w-11 shrink-0 items-center justify-center rounded-lg border border-[#f2c7bb] bg-[#fff1ed]">
            <span className="text-[10px] font-extrabold text-[#e84f26]">
              {file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#252525]">{file.name}</p>
            <p className="text-[11px] text-[#8c8885]">{formatBytes(file.size)}</p>
            {error && <p className="mt-0.5 text-[11px] font-medium text-red-600">{error}</p>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1efee] text-[#666] transition-colors hover:bg-[#e2dfdd]"
            title="Remove file"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : existingUploaded ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-green-700">{existingText ?? "File Uploaded"}</p>
            <p className="mt-0.5 text-[11px] text-[#6b6b6b]">Click to replace question paper</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#f1f0ef] text-[#3f3b39]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 15V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 14V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#252525]">
              Upload <span className="text-[#FF5623]">{label}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[#8c8885]">{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Previous Mappings Modal ────────────────────────────────────────────────────

interface PreviousMappingsModalProps {
  examId: string;
  sheets: AnswerSheet[];
  loading: boolean;
  onClose: () => void;
}

function PreviousMappingsModal({ examId, sheets, loading, onClose }: PreviousMappingsModalProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-140 flex-col rounded-[18px] bg-white p-5 shadow-[0_20px_60px_rgba(37,37,37,0.18)] sm:p-7">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#f0f0f0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#ffe5dc] text-[#ff5623]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4.5H15M3 9H15M3 13.5H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#252525]">Previous Mappings</h2>
              <p className="text-[12px] text-[#8c8885]">{sheets.length} answer sheet{sheets.length !== 1 ? "s" : ""} uploaded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8c8885] transition-colors hover:bg-[#f0f0f0] hover:text-[#252525]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body List */}
        <div className="flex min-h-40 flex-1 flex-col gap-2.5 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[#8c8885]">
              <SpinnerIcon size={16} /> Loading uploads…
            </div>
          ) : sheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#8c8885]">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5] text-[#b0b0b0]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="16" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-[#252525]">No previous uploads</p>
              <p className="mt-0.5 text-[12px] text-[#8c8885]">Uploaded answer sheets will show up here</p>
            </div>
          ) : (
            sheets.map((sheet) => {
              const statusCfg = SHEET_STATUS_CONFIG[sheet.status] ?? SHEET_STATUS_CONFIG.mapped;
              const studentName = sheet.student?.name;
              const rollNo = sheet.student?.rollNo;
              const title = studentName ?? (rollNo ? `Student #${rollNo}` : "Answer Sheet");

              return (
                <div
                  key={sheet._id}
                  className="flex items-center justify-between gap-3 rounded-[11px] border border-[#eee9e6] bg-[#fcfbfa] p-3.5 transition-all hover:bg-[#f6f4f3]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[13px] font-bold text-[#303030]">
                      {rollNo ? rollNo.slice(-3) : "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#252525]">{title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#8c8885]">
                        {rollNo && <span>Serial #{rollNo}</span>}
                        {sheet.pageCount && <span>· {sheet.pageCount} page{sheet.pageCount > 1 ? "s" : ""}</span>}
                        {sheet.totalScore !== undefined && (
                          <span className="font-semibold text-green-700">· Score: {sheet.totalScore}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/exams/${examId}/answer-sheets/${sheet._id}/mapping`);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-[#303030] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1a]"
                    >
                      <span>View</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-[#f0f0f0] pt-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#f0f0f0] px-5 py-2 text-[13px] font-semibold text-[#444] transition-colors hover:bg-[#e4e4e4]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SpinnerIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={`animate-spin ${className}`}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
