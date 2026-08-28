import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExam } from "@/lib/api";
import Sidebar, { HamburgerButton } from "@/components/Sidebar";
import { useSidebar } from "@/context/SidebarContext";
import extractingIcon from "@/assets/graphics/extracting.svg";

export default function LoadingPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isOpen, setIsOpen } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!examId) return;

    function poll() {
      if (!examId) return;
      getExam(examId)
        .then((exam) => {
          if (exam.status !== "processing") {
            if (intervalRef.current) clearInterval(intervalRef.current);
            navigate(`/exams/${examId}`, { replace: true });
          }
        })
        .catch(() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
        });
    }

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [examId, navigate]);

  return (
    <div className="flex h-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar collapsed={!isOpen} onToggle={() => setIsOpen(!isOpen)} />
      </div>
      {/* Mobile drawer sidebar */}
      <div className="lg:hidden">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top nav */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-white/70 backdrop-blur-md border-b border-white/60 shrink-0">
          <div className="flex items-center gap-3 text-[14px] text-[#6b6b6b]">
            <HamburgerButton onClick={() => setMobileOpen(true)} />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#c0c0c0]">
              <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span className="text-[#1a1a1a] font-medium">Exams</span>
          </div>
        </header>

        {/* Extracting state */}
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <img
              src={extractingIcon}
              alt="Extracting"
              className="w-28 h-28 animate-pulse"
            />
            <div className="text-center">
              <p className="text-[20px] font-bold text-[#1a1a1a]">Extracting...</p>
              <p className="text-[14px] text-[#6b6b6b] mt-1">This may take a while</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
