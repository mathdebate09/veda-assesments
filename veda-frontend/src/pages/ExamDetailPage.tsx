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
      } catch {/* ignore */}
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
      <div className="flex h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon size={32} />
          <p className="text-[14px] text-[#6b6b6b]">Loading exam details…</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-8 text-center max-w-sm">
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
    <div className="flex h-screen w-full bg-gradient-to-b from-[#f5f5f5] to-[#e8e5e5] overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md border-b border-white/60 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 text-[14px] text-[#6b6b6b]">
            <button
              onClick={() => navigate("/exams")}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e8e8e8] text-[#1a1a1a] transition-colors"
              title="Back to Exams"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M16 10H4M4 10L9 5M4 10L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#6b6b6b]">
                <rect x="3.5" y="2" width="11" height="14" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 6H12M6 9H12M6 12H9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="font-semibold text-[#1a1a1a]">{exam.title}</span>
              {exam.subject && (
                <span className="text-[#8c8c8c] text-[13px]">({exam.subject})</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Previous mappings button */}
            <button
              onClick={openPreviousMappings}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-[#fafafa] text-[#303030] rounded-full text-[13px] font-semibold border border-[#d8d8d8] shadow-sm hover:shadow transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 4H13.5M2.5 8H13.5M2.5 12H9.5" stroke="#FF5623" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Previous Mappings
              {previousSheets.length > 0 && (
                <span className="bg-[#FF5623] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                  {previousSheets.length}
                </span>
              )}
            </button>

            {/* Help */}
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0]">
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 14V14.5M10 11.5C10 10.5 11.5 10 11.5 8.5C11.5 7.4 10.8 6.5 9.8 6.5C8.8 6.5 8.2 7.2 8.2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Notification */}
            <div className="relative">
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0]">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3C7.2 3 5 5.2 5 8V12L3 14H17L15 12V8C15 5.2 12.8 3 10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 15C8 16.1 8.9 17 10 17C11.1 17 12 16.1 12 15" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#FF5623] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                8
              </span>
            </div>

            {/* Sparkle */}
            <button className="w-8 h-8 flex items-center justify-center text-[#FF5623]">
              <span className="text-[17px]">✦</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#e0e0e0]">
              <div className="w-8 h-8 rounded-full bg-[#303030] flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
                M
              </div>
              <span className="text-[13px] font-semibold text-[#1a1a1a]">Madhur Rastogi</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#8c8c8c]">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-[960px] w-full mx-auto">
          {/* Header Title */}
          <div className="text-center mb-2">
            <h1 className="text-[30px] md:text-[34px] font-extrabold text-[#222] tracking-tight flex items-center justify-center gap-2.5 flex-wrap">
              <span>Upload</span>
              <span className="bg-[#FFE6DE] text-[#FF5623] px-3.5 py-1 rounded-[12px] border border-[#FFD0C2]/70 font-extrabold inline-block shadow-sm">
                Question Paper & Answer Sheets
              </span>
            </h1>
            <p className="text-[15px] text-[#6b6b6b] mt-2 font-normal">
              Upload both files to get started
            </p>
          </div>

          {/* Central Graphic */}
          <div className="my-5 flex justify-center">
            <img
              src={mappingGraphic}
              alt="Teacher Illustration"
              className="w-[130px] h-[130px] object-contain drop-shadow-md select-none pointer-events-none"
            />
          </div>

          {/* Upload Cards Box */}
          <div className="w-full bg-white/60 backdrop-blur-md rounded-[24px] border border-white p-7 shadow-[0_8px_32px_rgba(0,0,0,0.05)] flex flex-col gap-5">
            {/* Two Side-by-Side Upload Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f0ecec]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#444] uppercase tracking-wider">
                  Serial Number <span className="text-[#FF5623]">*</span>
                </label>
                <input
                  type="text"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="e.g. 001, 10B-01"
                  className="h-11 px-4 rounded-[12px] border border-[#d8d8d8] bg-white text-[14px] text-[#1a1a1a] placeholder-[#adadad] outline-none focus:border-[#FF5623] focus:ring-2 focus:ring-[#FF5623]/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#444] uppercase tracking-wider">
                  Student Name <span className="text-[#9b9b9b] font-normal normal-case">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="h-11 px-4 rounded-[12px] border border-[#d8d8d8] bg-white text-[14px] text-[#1a1a1a] placeholder-[#adadad] outline-none focus:border-[#FF5623] focus:ring-2 focus:ring-[#FF5623]/10 transition-all"
                />
              </div>
            </div>

            {submitError && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-[12px] px-4 py-3">
                {submitError}
              </div>
            )}

            {/* Action CTA */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={handleStartMapping}
                disabled={!canStart}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#303030] text-white text-[14px] font-bold hover:bg-[#1a1a1a] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
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

              <p className="text-[12px] text-[#8c8c8c] text-center">
                Once both files are uploaded, you'll be able to map answers with questions
              </p>
            </div>
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
      className={`relative rounded-[18px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 min-h-[160px] ${
        dragging
          ? "border-[#FF5623] bg-[rgba(255,86,35,0.06)] scale-[1.01]"
          : error
          ? "border-red-400 bg-red-50/70"
          : file
          ? "border-[#e0e0e0] bg-white shadow-sm"
          : existingUploaded
          ? "border-green-300 bg-green-50/50 hover:border-green-400 cursor-pointer"
          : "border-[#d8d8d8] bg-white/70 cursor-pointer hover:border-[#b8b8b8] hover:bg-white"
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
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-11 h-13 bg-red-50 border border-red-200 rounded-[8px] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-extrabold text-red-600">
              {file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1a1a1a] truncate">{file.name}</p>
            <p className="text-[11px] text-[#8c8c8c]">{formatBytes(file.size)}</p>
            {error && <p className="text-[11px] text-red-600 mt-0.5 font-medium">{error}</p>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-7 h-7 rounded-full bg-[#f0f0f0] hover:bg-[#e0e0e0] flex items-center justify-center text-[#666] shrink-0 transition-colors"
            title="Remove file"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : existingUploaded ? (
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-green-700">{existingText ?? "File Uploaded"}</p>
            <p className="text-[11px] text-[#6b6b6b] mt-0.5">Click to replace question paper</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#f2f2f2] flex items-center justify-center text-[#444] shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 15V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 14V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#222]">
              Upload <span className="text-[#FF5623]">{label}</span>
            </p>
            <p className="text-[11px] text-[#8c8c8c] mt-0.5">{hint}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl p-7 w-full max-w-[560px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#FFE5DC] text-[#FF5623] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4.5H15M3 9H15M3 13.5H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#1a1a1a]">Previous Mappings</h2>
              <p className="text-[12px] text-[#8c8c8c]">{sheets.length} answer sheet{sheets.length !== 1 ? "s" : ""} uploaded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#f0f0f0] flex items-center justify-center text-[#8c8c8c] hover:text-[#1a1a1a] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2.5 min-h-[160px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#8c8c8c] text-[13px] gap-2">
              <SpinnerIcon size={16} /> Loading uploads…
            </div>
          ) : sheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#8c8c8c]">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-3 text-[#b0b0b0]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="16" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">No previous uploads</p>
              <p className="text-[12px] text-[#8c8c8c] mt-0.5">Uploaded answer sheets will show up here</p>
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
                  className="flex items-center justify-between gap-3 p-3.5 rounded-[14px] bg-[#fafafa] hover:bg-[#f4f4f4] border border-[#eee] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center font-bold text-[13px] text-[#303030] shrink-0">
                      {rollNo ? rollNo.slice(-3) : "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[#1a1a1a] truncate">{title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#8c8c8c]">
                        {rollNo && <span>Serial #{rollNo}</span>}
                        {sheet.pageCount && <span>· {sheet.pageCount} page{sheet.pageCount > 1 ? "s" : ""}</span>}
                        {sheet.totalScore !== undefined && (
                          <span className="font-semibold text-green-700">· Score: {sheet.totalScore}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/exams/${examId}/answer-sheets/${sheet._id}/mapping`);
                      }}
                      className="px-3 py-1.5 rounded-[10px] bg-[#303030] hover:bg-[#1a1a1a] text-white text-[12px] font-semibold transition-colors flex items-center gap-1"
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
        <div className="pt-3 border-t border-[#f0f0f0] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[10px] bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[13px] font-semibold text-[#444] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Component ─────────────────────────────────────────────────────────

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-[240px] shrink-0 flex flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-10 rounded-r-[24px]">
      {/* Brand */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#303030] rounded-[9px] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L7 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-extrabold text-[#1a1a1a] text-[17px] tracking-tight">VedaAI</span>
        </div>
        <button className="text-[#8c8c8c] hover:text-[#1a1a1a]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 2V14" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
      </div>

      {/* AI Teacher's Toolkit pill */}
      <div className="px-5 mb-5">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#303030] text-white rounded-[14px] text-[13px] font-bold shadow-sm border border-[#FF5623]/30">
          <span className="text-[#FF5623] text-sm">✦</span>
          AI Teacher's Toolkit
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-1 text-[14px]">
        {[
          { label: "Home", to: "/exams", icon: "⊞" },
          { label: "My Classroom", to: "/classrooms", icon: "👥" },
          { label: "Assignments", to: "/exams", icon: "📄" },
          { label: "Exams", to: "/exams", active: true, icon: "📋" },
          { label: "My Library", to: "/exams", icon: "⏱" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] font-medium transition-colors text-left ${
              item.active
                ? "bg-[#f2f2f2] text-[#1a1a1a] font-bold"
                : "text-[#6b6b6b] hover:bg-[#f8f8f8] hover:text-[#1a1a1a]"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Info: School Card */}
      <div className="p-4 border-t border-[#f0f0f0] flex flex-col gap-3">
        <button className="flex items-center gap-2.5 text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] px-2 py-1">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Settings
        </button>

        <div className="flex items-center gap-3 p-2.5 rounded-[14px] bg-[#f5f5f5]">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[11px] font-bold border border-[#e0e0e0] text-green-700">
            DPS
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#1a1a1a] truncate leading-tight">Delhi Public School</p>
            <p className="text-[10px] text-[#8c8c8c] truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
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
