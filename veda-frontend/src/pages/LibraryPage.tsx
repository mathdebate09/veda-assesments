import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { getAnswerSheets, getExams, type AnswerSheet, type Exam } from "@/lib/api";

type GalleryKind = "question-paper" | "answer-sheet";

type LibraryItem = {
    id: string;
    examId: string;
    kind: GalleryKind;
    title: string;
    subject: string;
    meta: string;
    route: string;
    previewUrl?: string;
    pages: string[];
    studentLabel?: string;
};

function normalizePages(pages?: string[]) {
    return Array.isArray(pages) ? pages.filter(Boolean) : [];
}

export default function LibraryPage() {
    const navigate = useNavigate();
    const [questionPapers, setQuestionPapers] = useState<LibraryItem[]>([]);
    const [answerSheets, setAnswerSheets] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<LibraryItem | null>(null);

    useEffect(() => {
        let active = true;

        async function loadLibrary() {
            try {
                setLoading(true);
                setError("");

                const exams = await getExams();

                const answerSheetCollections = await Promise.all(
                    exams.map(async (exam) => {
                        try {
                            const sheets = await getAnswerSheets(exam._id);
                            return { examId: exam._id, sheets };
                        } catch {
                            return { examId: exam._id, sheets: [] as AnswerSheet[] };
                        }
                    }),
                );

                const nextQuestionPapers: LibraryItem[] = exams
                    .filter((exam) => {
                        const pages = normalizePages(exam.questionPaperPageImages);
                        return pages.length > 0 || !!exam.questionPaperUrl;
                    })
                    .map((exam) => {
                        const pages = normalizePages(exam.questionPaperPageImages);
                        const previewUrl = exam.questionPaperUrl || pages[0];

                        return {
                            id: exam._id,
                            examId: exam._id,
                            kind: "question-paper",
                            title: exam.title,
                            subject: exam.subject || "General",
                            meta: exam.status || "Ready",
                            route: `/exams/${exam._id}`,
                            previewUrl,
                            pages,
                        };
                    });

                const nextAnswerSheets: LibraryItem[] = answerSheetCollections.flatMap(({ examId, sheets }) => {
                    const exam = exams.find((item) => item._id === examId);

                    return sheets.map((sheet) => {
                        const studentLabel =
                            sheet.student?.rollNo ||
                            sheet.student?.name ||
                            `Student ${sheet._id.slice(-4)}`;

                        return {
                            id: sheet._id,
                            examId,
                            kind: "answer-sheet",
                            title: exam?.title || "Answer sheet",
                            subject: exam?.subject || "Student submission",
                            meta: `Serial ${studentLabel}`,
                            route: `/exams/${examId}/answer-sheets/${sheet._id}/mapping`,
                            previewUrl: sheet.pageImages?.[0],
                            pages: normalizePages(sheet.pageImages),
                            studentLabel,
                        };
                    });
                });

                if (!active) return;

                setQuestionPapers(nextQuestionPapers);
                setAnswerSheets(nextAnswerSheets);
            } catch (e) {
                if (!active) return;
                setError((e as Error).message || "Unable to load your library.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadLibrary();

        return () => {
            active = false;
        };
    }, []);

    const totalCount = useMemo(
        () => questionPapers.length + answerSheets.length,
        [questionPapers.length, answerSheets.length],
    );

    return (
        <AppShell title="My Library">
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B45C34]">
                            Teacher workspace
                        </p>
                        <h1 className="mt-1 text-[26px] font-bold text-[#1a1a1a]">My Library</h1>
                    </div>
                    <div className="rounded-full border border-[#e5e2df] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6b6b6b] shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                        {totalCount} document{totalCount === 1 ? "" : "s"}
                    </div>
                </div>

                {loading && (
                    <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-[#ece7e4] bg-white/80 text-[14px] text-[#6b6b6b] shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                        Loading uploaded documents…
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-[16px] border border-[#f2d8d0] bg-[#fff8f5] px-5 py-4 text-[14px] text-red-700">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-5">
                        <DocumentSection
                            title="Question papers"
                            emptyText="No question papers uploaded yet."
                            items={questionPapers}
                            onOpen={(item) => setSelected(item)}
                            onNavigate={(route) => navigate(route)}
                        />

                        <DocumentSection
                            title="Answer sheets"
                            emptyText="No answer sheets uploaded yet."
                            items={answerSheets}
                            onOpen={(item) => setSelected(item)}
                            onNavigate={(route) => navigate(route)}
                        />
                    </div>
                )}
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-[800px] rounded-[22px] border border-[#efefef] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
                        <div className="flex items-center justify-between gap-3 border-b border-[#f1efee] px-5 py-4">
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium uppercase tracking-[0.12em] text-[#B45C34]">
                                    {selected.kind === "question-paper" ? "Question paper" : "Answer sheet"}
                                </p>
                                <h2 className="truncate text-[18px] font-bold text-[#1a1a1a]">{selected.title}</h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b6b6b] transition hover:bg-[#f5f3f2] hover:text-[#1a1a1a]"
                                aria-label="Close preview"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
                            {selected.pages.length > 0 ? (
                                <div className="space-y-4">
                                    {selected.pages.map((page, index) => (
                                        <div
                                            key={`${selected.id}-${index}`}
                                            className="overflow-hidden rounded-[16px] border border-[#ece8e5] bg-[#f8f7f5]"
                                        >
                                            <img
                                                src={page}
                                                alt={`${selected.title} page ${index + 1}`}
                                                className="h-auto w-full object-contain"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-[#e0ddd9] bg-[#faf9f8] text-[14px] text-[#7a7a7a]">
                                    No preview available for this document.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-[#f1efee] bg-[#fcfbfa] px-5 py-4">
                            <div className="text-[13px] text-[#6b6b6b]">
                                <div className="font-medium text-[#1a1a1a]">{selected.subject}</div>
                                <div>{selected.meta}</div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelected(null);
                                    navigate(selected.route);
                                }}
                                className="rounded-[10px] bg-[#FF5623] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1a1a1a]"
                            >
                                Open {selected.kind === "question-paper" ? "exam" : "graded sheet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}

function DocumentSection({
    title,
    emptyText,
    items,
    onOpen,
    onNavigate,
}: {
    title: string;
    emptyText: string;
    items: LibraryItem[];
    onOpen: (item: LibraryItem) => void;
    onNavigate: (path: string) => void;
}) {
    return (
        <section className="">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <h2 className="text-[16px] font-bold text-[#272727]">{title}</h2>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[10px] font-semibold text-[#272727]">
                    {items.length}
                </span>
            </div>

            {items.length === 0 ? (
                <div className="flex min-h-[150px] items-center justify-center rounded-[14px] border border-dashed border-[#e8e5e2] bg-[#faf9f8] text-[13px] text-[#6d6d6d]">
                    {emptyText}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {items.map((item) => (
                        <article
                            key={item.id}
                            className="overflow-hidden rounded-[16px] border bg-[#2f2f2f] text-white"
                        >
                            <button
                                type="button"
                                onClick={() => onOpen(item)}
                                className="block w-full bg-[#272727] text-left"
                            >
                                <div className="flex items-start justify-between gap-2 px-2.5 pb-2 pt-2.5">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-[13px] font-semibold text-white leading-tight">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 text-[11px] text-white/65">{item.subject}</p>
                                    </div>

                                    <span
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF5623] text-[16px] font-bold text-white shadow-[0_4px_12px_rgba(255,86,35,0.35)]"
                                        aria-label={`Open ${item.title}`}
                                        title={`Open ${item.title}`}
                                    >
                                        ↗
                                    </span>
                                </div>

                                <div className="border-t bg-[#1f1f1f]">
                                    {item.previewUrl ? (
                                        <img
                                            src={item.previewUrl}
                                            alt={item.title}
                                            className="h-[118px] w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-[118px] items-center justify-center bg-[#1f1f1f] text-[11px] font-medium text-white/65">
                                            No preview
                                        </div>
                                    )}
                                </div>
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
