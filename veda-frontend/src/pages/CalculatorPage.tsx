import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

const vedaLogo = "https://ik.imagekit.io/jayowiee/assessments/veda-ai/logo.png";

const TOTAL_GRADES = 12;
const DEFAULT_SECTIONS = 5;
const DEFAULT_STUDENTS = 50;
const DEFAULT_COST_INR = 4.77;

function getPagesForGrade(grade: number) {
    return Math.ceil(grade * 1.4);
}

function formatInr(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatUsd(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function CalculatorPage() {
    const [sections, setSections] = useState(DEFAULT_SECTIONS);
    const [students, setStudents] = useState(DEFAULT_STUDENTS);
    const costPerSheet = DEFAULT_COST_INR;

    const { gradeBreakdown, totalPages, totalCostInr, totalCostUsd, totalStudents } = useMemo(() => {
        const breakdown = Array.from({ length: TOTAL_GRADES }, (_, i) => {
            const grade = i + 1;
            const pagesPerStudent = getPagesForGrade(grade);
            const studentsInGrade = sections * students;
            const pagesForGrade = studentsInGrade * pagesPerStudent;
            const sheets = pagesForGrade / 4;
            const costInr = sheets * costPerSheet;
            const costUsd = sheets * 0.05;
            return { grade, pagesPerStudent, studentsInGrade, pagesForGrade, costInr, costUsd };
        });

        const pages = breakdown.reduce((s, r) => s + r.pagesForGrade, 0);
        const cInr = (pages / 4) * costPerSheet;
        const cUsd = (pages / 4) * 0.05;
        const stud = sections * students * TOTAL_GRADES;

        return { gradeBreakdown: breakdown, totalPages: pages, totalCostInr: cInr, totalCostUsd: cUsd, totalStudents: stud };
    }, [sections, students, costPerSheet]);

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-[radial-gradient(circle_at_top,_#fffdfb,_#f5f1ec_38%,_#efe9e2_100%)] text-[#1a1a1a]">
            {/* Nav */}
            <header className="flex-none px-6 pt-4 pb-3">
                <div className="mx-auto max-w-[1280px] flex items-center justify-between rounded-full border border-[#ece3dc] bg-white/70 px-4 py-2.5 shadow-[0_6px_20px_rgba(28,22,16,0.04)] backdrop-blur-md">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src={vedaLogo} alt="VedaAI logo" className="h-8 w-8 rounded-[8px] object-cover" />
                        <span className="text-[1rem] font-bold tracking-[-0.04em] text-[#1a1a1a]">VedaAI</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link to="/" className="rounded-full border border-[#ece3dc] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f5f2]">
                            Back
                        </Link>
                        <Link to="/login" className="rounded-full bg-[#1a1a1a] px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#303030]">
                            Sign in
                        </Link>
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 min-h-0 px-6 pb-5">
                <div className="mx-auto max-w-[1280px] h-full grid grid-cols-[1fr_300px] gap-4">

                    {/* Left column */}
                    <div className="min-h-0 flex flex-col gap-4">

                        {/* Hero card */}
                        <div className="rounded-[24px] border border-[#efe5df] bg-white/80 p-5 shadow-[0_12px_40px_rgba(34,24,18,0.07)] backdrop-blur-sm">
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1 min-w-0">
                                    <div className="inline-flex items-center rounded-full border border-[#f7d8c8] bg-[#fff3ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff5623]">
                                        Price calculator
                                    </div>
                                    <h1 className="mt-3 text-2xl font-bold leading-[1.05] tracking-[-0.05em] text-[#1a1a1a] sm:text-3xl">
                                        How much does a full semester cost to grade?
                                    </h1>
                                    <p className="mt-2 text-sm leading-6 text-[#5d5b5a]">
                                        ₹{costPerSheet.toFixed(2)} per 4-page answer sheet · grades 1–12 · {sections} sections × {students} students
                                    </p>
                                </div>

                                {/* Big cost number */}
                                <div className="flex-none rounded-[18px] border border-[#201d1b] bg-[#171513] p-4 text-white shadow-[0_16px_40px_rgba(18,14,13,0.22)] min-w-[196px]">
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Total semester cost</p>
                                    <p className="mt-2 text-[2rem] font-bold tracking-[-0.06em] leading-none text-white">
                                        {formatInr(totalCostInr)}
                                    </p>
                                    <p className="mt-1.5 text-xs text-white/50">{formatUsd(totalCostUsd)} · {totalPages.toLocaleString("en-IN")} pages</p>
                                    <div className="mt-3 rounded-xl border border-[#ff5623]/25 bg-[#ff5623]/10 px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#ffb39a]">Cost per page</p>
                                        <p className="mt-0.5 text-sm font-semibold">₹{(costPerSheet / 4).toFixed(2)}/page</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3 stats row */}
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="rounded-[14px] border border-[#ece3dc] bg-[#faf7f4] px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#ff5623]">Students</p>
                                    <p className="mt-1.5 text-xl font-bold tracking-[-0.05em]">{totalStudents.toLocaleString("en-IN")}</p>
                                    <p className="mt-0.5 text-xs text-[#5d5b5a]">across grades 1–12</p>
                                </div>
                                <div className="rounded-[14px] border border-[#ece3dc] bg-[#faf7f4] px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#ff5623]">Pages graded</p>
                                    <p className="mt-1.5 text-xl font-bold tracking-[-0.05em]">{totalPages.toLocaleString("en-IN")}</p>
                                    <p className="mt-0.5 text-xs text-[#5d5b5a]">grade × 1.4 model</p>
                                </div>
                                <div className="rounded-[14px] border border-[#ece3dc] bg-[#faf7f4] px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#ff5623]">USD equivalent</p>
                                    <p className="mt-1.5 text-xl font-bold tracking-[-0.05em]">{formatUsd(totalCostUsd)}</p>
                                    <p className="mt-0.5 text-xs text-[#5d5b5a]">$0.05 / 4-page sheet</p>
                                </div>
                            </div>
                        </div>

                        {/* Grade table */}
                        <div className="flex-1 min-h-0 rounded-[24px] border border-[#ece3dc] bg-white/80 p-5 shadow-[0_8px_20px_rgba(34,24,18,0.04)] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-[#ff5623] font-semibold">Breakdown by grade</p>
                                <p className="text-xs text-[#9a9693]">{TOTAL_GRADES} grades total</p>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto rounded-[16px] border border-[#ece3dc]">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#faf7f4]">
                                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5d5b5a]">Grade</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5d5b5a]">Students</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5d5b5a]">Pages/student</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5d5b5a]">Total pages</th>
                                            <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5d5b5a]">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gradeBreakdown.map(({ grade, pagesPerStudent, studentsInGrade, pagesForGrade, costInr }) => (
                                            <tr key={grade} className="border-t border-[#ece3dc] bg-white hover:bg-[#faf7f4] transition-colors">
                                                <td className="px-4 py-2.5 font-semibold text-[#1a1a1a]">Grade {grade}</td>
                                                <td className="px-4 py-2.5 text-[#5d5b5a]">{studentsInGrade.toLocaleString("en-IN")}</td>
                                                <td className="px-4 py-2.5 text-[#5d5b5a]">{pagesPerStudent}</td>
                                                <td className="px-4 py-2.5 text-[#5d5b5a]">{pagesForGrade.toLocaleString("en-IN")}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-[#ff5623]">{formatInr(costInr)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right column - editor panel */}
                    <div className="min-h-0 flex flex-col gap-4">

                        {/* Controls card */}
                        <div className="rounded-[24px] border border-[#ece3dc] bg-white/80 p-5 shadow-[0_8px_20px_rgba(34,24,18,0.04)]">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#ff5623] font-semibold">Adjust model</p>
                            <p className="mt-1 text-xs text-[#9a9693]">Numbers update live</p>

                            <div className="mt-5 space-y-5">
                                {/* Sections per grade */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-[#1a1a1a]">Sections per grade</label>
                                        <span className="text-xs font-bold text-[#ff5623] tabular-nums w-6 text-right">{sections}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={20}
                                        step={1}
                                        value={sections}
                                        onChange={e => setSections(+e.target.value)}
                                        className="w-full h-1.5 rounded-full appearance-none bg-[#ece3dc] accent-[#ff5623] cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-[#9a9693]">1</span>
                                        <span className="text-[10px] text-[#9a9693]">20</span>
                                    </div>
                                </div>

                                {/* Students per section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-[#1a1a1a]">Students per section</label>
                                        <span className="text-xs font-bold text-[#ff5623] tabular-nums w-8 text-right">{students}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={10}
                                        max={100}
                                        step={5}
                                        value={students}
                                        onChange={e => setStudents(+e.target.value)}
                                        className="w-full h-1.5 rounded-full appearance-none bg-[#ece3dc] accent-[#ff5623] cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-[#9a9693]">10</span>
                                        <span className="text-[10px] text-[#9a9693]">100</span>
                                    </div>
                                </div>

                            </div>

                            {/* Reset */}
                            <button
                                onClick={() => { setSections(DEFAULT_SECTIONS); setStudents(DEFAULT_STUDENTS); }}
                                className="mt-5 w-full rounded-full border border-[#ece3dc] bg-[#faf7f4] py-2 text-xs font-semibold text-[#5d5b5a] transition-colors hover:bg-[#f0ece8]"
                            >
                                Reset to defaults
                            </button>
                        </div>

                        {/* Why it matters */}
                        <div className="rounded-[24px] border border-[#f7d8c8] bg-[#fff3ee] p-5 shadow-[0_8px_20px_rgba(34,24,18,0.04)]">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[#ff5623] font-semibold">Why this matters</p>
                            <p className="mt-3 text-sm font-bold leading-snug tracking-[-0.03em] text-[#1a1a1a]">
                                One full school semester — still remarkably affordable.
                            </p>
                            <p className="mt-2.5 text-xs leading-5 text-[#5d5b5a]">
                                At {formatInr(totalCostInr)} for every answer sheet across all 12 grades, AI-assisted grading is practical for any school without sacrificing turnaround or consistency.
                            </p>
                            <Link
                                to="/login"
                                className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-[#1a1a1a] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#303030]"
                            >
                                Start grading
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}