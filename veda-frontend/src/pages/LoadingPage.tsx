import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExam } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
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
      <div className="hidden h-full p-3 lg:flex">
        <Sidebar collapsed={!isOpen} onToggle={() => setIsOpen(!isOpen)} />
      </div>
      {/* Mobile drawer sidebar */}
      <div className="lg:hidden">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Exams" showBack mobileMenuOpen={() => setMobileOpen(true)} />

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
