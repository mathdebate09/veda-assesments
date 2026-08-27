import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadQuestionPaper, uploadAnswerSheet, getExam } from "@/lib/api";
import { convertFileToPngList } from "@/lib/pdfToImages";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_BYTES = 25 * 1024 * 1024;

interface FileState {
  file: File;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | undefined {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Only PDF, PNG, or JPEG files are accepted.";
  if (file.size > MAX_BYTES) return "File exceeds the 25 MB limit.";
}

export default function UploadPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [examTitle, setExamTitle] = useState("");
  const [questionFile, setQuestionFile] = useState<FileState | null>(null);
  const [answerFile, setAnswerFile] = useState<FileState | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [uploadError, setUploadError] = useState("");

  const qRef = useRef<HTMLInputElement>(null);
  const aRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (examId) {
      getExam(examId)
        .then((d) => setExamTitle(d?.title ?? ""))
        .catch(() => {});
    }
  }, [examId]);

  function pickFile(which: "question" | "answer", file: File) {
    const error = validateFile(file);
    if (which === "question") setQuestionFile({ file, error });
    else setAnswerFile({ file, error });
  }

  function handleDrop(which: "question" | "answer", e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) pickFile(which, file);
  }

  async function handleStartMapping() {
    if (!examId || !questionFile?.file || !answerFile?.file || !studentName.trim()) return;
    if (questionFile.error || answerFile.error) return;

    setUploading(true);
    setProgressText("Preparing documents…");
    setUploadError("");
    try {
      setProgressText("Converting Question Paper PDF to PNG…");
      const qpPages = await convertFileToPngList(questionFile.file, (msg) => setProgressText(msg));
      setProgressText("Uploading Question Paper…");
      await uploadQuestionPaper(examId, qpPages);

      setProgressText("Converting Answer Sheet PDF to PNG…");
      const asPages = await convertFileToPngList(answerFile.file, (msg) => setProgressText(msg));
      const result = await uploadAnswerSheet(
        examId,
        studentRoll.trim() || studentName.trim(),
        studentName.trim() || undefined,
        asPages,
      );

      const sheetId =
        result?.answerSheet?._id ||
        result?.answerSheetId ||
        (Array.isArray(result) ? result[0]?.answerSheetId || result[0]?.answerSheet?._id : undefined);

      if (sheetId) {
        navigate(`/exams/${examId}/answer-sheets/${sheetId}/mapping`);
      } else {
        navigate(`/exams/${examId}/loading`);
      }
    } catch (e) {
      setUploadError((e as Error).message ?? "Upload failed. Please try again.");
      setUploading(false);
      setProgressText("");
    }
  }

  const canStart =
    !!questionFile?.file &&
    !questionFile.error &&
    !!answerFile?.file &&
    !answerFile.error &&
    !!studentName.trim() &&
    !uploading;

  return (
    <div className="min-h-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav */}
        <header className="h-14 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b border-white/60 shrink-0">
          <div className="flex items-center gap-2 text-[14px] text-[#6b6b6b]">
            <button onClick={() => navigate("/exams")} className="hover:text-[#1a1a1a] transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline -mt-0.5 mr-1">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exams
            </button>
            {examTitle && <><span>›</span><span className="text-[#1a1a1a] font-medium">{examTitle}</span></>}
          </div>
          <TopNavRight />
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="flex items-baseline gap-2 justify-center flex-wrap">
              <span className="text-[32px] font-bold text-[#2b2b2b] tracking-tight">Upload</span>
              <span className="text-[32px] font-bold text-[#FF5623] tracking-tight underline underline-offset-4 decoration-wavy decoration-[#FF5623]/40">
                Question Paper & Answer Sheets
              </span>
            </div>
            <p className="text-[16px] text-[#6b6b6b] mt-2">Upload both files to get started</p>
          </div>

          {/* Upload zones container */}
          <div className="w-full max-w-[800px] bg-white/50 backdrop-blur rounded-[20px] border border-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <DropZone
                label="Upload Question Paper"
                hint="Max 10MB"
                fileState={questionFile}
                inputRef={qRef}
                onDrop={(e) => handleDrop("question", e)}
                onChange={(e) => e.target.files?.[0] && pickFile("question", e.target.files[0])}
                onRemove={() => setQuestionFile(null)}
              />
              <DropZone
                label="Upload Answer Sheet"
                hint="Max 10MB"
                fileState={answerFile}
                inputRef={aRef}
                onDrop={(e) => handleDrop("answer", e)}
                onChange={(e) => e.target.files?.[0] && pickFile("answer", e.target.files[0])}
                onRemove={() => setAnswerFile(null)}
              />
            </div>

            {/* Student info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6b6b6b] uppercase tracking-wide">Student Name *</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-10 px-3.5 rounded-[10px] border border-[#e0e0e0] bg-white text-[14px] text-[#1a1a1a] placeholder-[#b0b0b0] outline-none focus:border-[#303030] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6b6b6b] uppercase tracking-wide">Roll No. (optional)</label>
                <input
                  type="text"
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                  placeholder="e.g. 10B-01"
                  className="h-10 px-3.5 rounded-[10px] border border-[#e0e0e0] bg-white text-[14px] text-[#1a1a1a] placeholder-[#b0b0b0] outline-none focus:border-[#303030] transition-colors"
                />
              </div>
            </div>

            {uploadError && (
              <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
                {uploadError}
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleStartMapping}
                disabled={!canStart}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#303030] text-white text-[14px] font-semibold hover:bg-[#1a1a1a] active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><SpinnerIcon />{progressText || "Uploading…"}</>
                ) : (
                  <>Start Mapping <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M9 4L13 8L9 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></>
                )}
              </button>
              {!canStart && !uploading && (
                <p className="text-[12px] text-[#9b9b9b] text-center">
                  {!questionFile?.file || !answerFile?.file
                    ? "Upload both files and enter student name to continue"
                    : !studentName.trim()
                    ? "Enter the student's name to continue"
                    : "Fix file errors above to continue"}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface DropZoneProps {
  label: string;
  hint: string;
  fileState: FileState | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function DropZone({ label, hint, fileState, inputRef, onDrop, onChange, onRemove }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { setDragging(false); onDrop(e); }}
      onClick={() => !fileState && inputRef.current?.click()}
      className={`relative rounded-[16px] border-2 border-dashed transition-all ${
        dragging
          ? "border-[#FF5623] bg-[rgba(255,86,35,0.04)]"
          : fileState?.error
          ? "border-red-400 bg-red-50"
          : fileState
          ? "border-[#e0e0e0] bg-white"
          : "border-[#d0d0d0] bg-white/60 cursor-pointer hover:border-[#b0b0b0] hover:bg-white/80"
      } min-h-[160px] flex flex-col items-center justify-center p-5 gap-3`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onChange}
      />

      {!fileState ? (
        <>
          <div className="w-10 h-10 flex items-center justify-center text-[#9b9b9b]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 20V10M14 10L10 14M14 10L18 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="4" y="4" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-[#303030]">
              Upload <span className="text-[#FF5623]">{label.replace("Upload ", "")}</span>
            </p>
            <p className="text-[12px] text-[#9b9b9b] mt-0.5">{hint}</p>
          </div>
        </>
      ) : (
        <>
          {/* File preview */}
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-12 bg-red-100 rounded-[6px] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-red-600">
                {fileState.file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">{fileState.file.name}</p>
              <p className="text-[11px] text-[#9b9b9b]">{formatBytes(fileState.file.size)}</p>
              {fileState.error && (
                <p className="text-[11px] text-red-600 mt-0.5">{fileState.error}</p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-6 h-6 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[#6b6b6b] hover:bg-[#e0e0e0] shrink-0 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.06)] z-10 rounded-r-[20px]">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="w-8 h-8 bg-[#303030] rounded-[8px] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L7 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-bold text-[#1a1a1a] text-[15px] tracking-tight">VedaAI</span>
      </div>
      <div className="px-4 mb-5">
        <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#303030] text-white rounded-[10px] text-[13px] font-semibold">
          <span className="text-[#FF5623]">✦</span>
          AI Teacher's Toolkit
        </button>
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {[
          { label: "Home", to: "/exams" },
          { label: "My Classroom", to: "/classrooms" },
          { label: "Exams", to: "/exams" },
        ].map(({ label, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors ${label === "Exams" ? "bg-[#f5f5f5] text-[#1a1a1a] font-semibold" : ""}`}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function TopNavRight() {
  return (
    <div className="flex items-center gap-3">
      <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0] text-[13px]">?</button>
      <div className="relative">
        <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2.5C5.79 2.5 4 4.29 4 6.5V10L2.5 11.5H13.5L12 10V6.5C12 4.29 10.21 2.5 8 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M6.5 11.5C6.5 12.33 7.17 13 8 13C8.83 13 9.5 12.33 9.5 11.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#FF5623] rounded-full" />
      </div>
      <div className="w-7 h-7 rounded-full bg-[#303030] flex items-center justify-center text-white text-[11px] font-bold">M</div>
    </div>
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
