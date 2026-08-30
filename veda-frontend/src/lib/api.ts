import { clearToken, getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    window.location.replace("/login");
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }

  const json = await res.json();
  return json.data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institute?: {
    _id: string;
    name: string;
    logoUrl?: string;
    location: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ── Exams ─────────────────────────────────────────────────────────────────────

export interface Exam {
  _id: string;
  title: string;
  subject: string;
  totalMarks: number;
  status: "draft" | "processing" | "ready" | "graded";
  questionPaperUrl?: string;
  questionPaperPageImages?: string[];
  createdAt?: string;
  answerSheets?: Array<AnswerSheet | string>;
}

export type ExamDetail = Exam & { questions: Question[] };

export function getExams() {
  return request<Exam[]>("/exams");
}

export function getExam(id: string) {
  return request<ExamDetail>(`/exams/${id}`);
}

export interface CreateExamBody {
  title: string;
  subject?: string;
  totalMarks?: number;
}

export function createExam(body: CreateExamBody) {
  return request<Exam>("/exams", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadQuestionPaper(examId: string, file: File | File[]) {
  const form = new FormData();
  if (Array.isArray(file)) {
    for (const f of file) {
      form.append("files", f);
    }
  } else {
    form.append("files", file);
    form.append("file", file);
  }
  const data = await request<any>(`/exams/${examId}/question-paper`, {
    method: "POST",
    body: form,
  });
  if (Array.isArray(data) && data[0]) {
    return data[0];
  }
  return data;
}

// ── Answer Sheets ─────────────────────────────────────────────────────────────

export interface UploadAnswerSheetBody {
  /** Serial number — required */
  serialNo: string;
  /** Student name — optional */
  studentName?: string;
}

export function getAnswerSheets(examId: string) {
  return request<AnswerSheet[]>(`/exams/${examId}/answer-sheets`);
}

export async function uploadAnswerSheet(
  examId: string,
  serialNo: string,
  studentName: string | undefined,
  file: File | File[],
) {
  const form = new FormData();
  if (Array.isArray(file)) {
    for (const f of file) {
      form.append("files", f);
    }
  } else {
    form.append("files", file);
    form.append("file", file);
  }
  form.append("studentRollNo", serialNo);
  if (studentName?.trim()) form.append("studentName", studentName.trim());
  const data = await request<any>(
    `/exams/${examId}/answer-sheets`,
    { method: "POST", body: form }
  );
  if (Array.isArray(data) && data[0]) {
    const item = data[0];
    return {
      ...item,
      answerSheet: { _id: item.answerSheetId, id: item.answerSheetId, pageImages: item.pageImages },
    };
  }
  return data;
}

// ── Grading ───────────────────────────────────────────────────────────────────

export interface Question {
  _id: string;
  number: string;
  subPart?: string | null;
  displayId: string;
  text: string;
  maxMarks: number;
  orderIndex: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnswerRegion {
  _id: string;
  question?: string;
  questionRef?: string;
  extractedText: string;
  isUnmatched: boolean;
  segments: Array<{ pageIndex: number; boundingBox: BoundingBox }>;
}

export interface Grade {
  _id: string;
  question: string;
  answerRegion?: string;
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
  aiFeedback?: string;
  teacherOverride?: number | null;
}

export interface Summary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
}

export interface AnswerSheet {
  _id: string;
  exam: string | { _id: string; title: string; totalMarks: number };
  student?: { _id: string; name: string; rollNo?: string };
  pageImages: string[];
  status: "processing" | "mapped" | "graded";
  totalScore?: number;
  pageCount?: number;
}

export interface SplitViewPayload {
  answerSheet: AnswerSheet;
  questions: Question[];
  answerRegions: AnswerRegion[];
  grades: Grade[];
  summary?: Summary;
}

export function getAnswerSheet(examId: string, sheetId: string) {
  return request<SplitViewPayload>(`/exams/${examId}/answer-sheets/${sheetId}`);
}

export function gradeAnswerSheet(examId: string, sheetId: string) {
  return request<{ grades: Grade[]; summary: Summary }>(
    `/exams/${examId}/answer-sheets/${sheetId}/grade`,
    { method: "POST" }
  );
}

export function patchGrade(examId: string, sheetId: string, gradeId: string, marksAwarded: number) {
  return request<Grade>(`/exams/${examId}/answer-sheets/${sheetId}/grades/${gradeId}`, {
    method: "PATCH",
    body: JSON.stringify({ marksAwarded }),
  });
}

export function assignRegion(
  examId: string,
  sheetId: string,
  regionId: string,
  questionId: string
) {
  return request<AnswerRegion>(
    `/exams/${examId}/answer-sheets/${sheetId}/regions/${regionId}/assign`,
    { method: "PATCH", body: JSON.stringify({ questionId }) }
  );
}

// ── Assessment ────────────────────────────────────────────────────────────────

export interface LearningGapItem {
  topic: string;
  gapPercent: number;
}

export interface StudentSegmentation {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface ExamAssessment {
  examId: string;
  examTitle: string;
  subject: string;
  totalMarks: number;
  submissionCount: number;
  totalStudents: number;
  averageScore: number;
  topScore: number;
  classMedian: number;
  lowestScore: number;
  segmentation: StudentSegmentation;
  learningGaps: LearningGapItem[];
  teacherInsights: string[];
}

export function getExamAssessment(examId: string) {
  return request<ExamAssessment>(`/exams/${examId}/assessment`);
}


// ── Classrooms ────────────────────────────────────────────────────────────────

export interface Classroom {
  _id: string;
  name: string;
  standard?: string;
  subject?: string;
  studentCount?: number;
  examCount?: number;
}

export interface Student {
  _id: string;
  name: string;
  rollNo?: string;
}

export interface ClassroomDetail {
  _id: string;
  name: string;
  standard?: string;
  subject?: string;
  students: Student[];
  exams: Exam[];
}

export function getClassrooms() {
  return request<Classroom[]>("/classrooms");
}

export function getClassroom(id: string) {
  return request<ClassroomDetail>(`/classrooms/${id}`);
}
