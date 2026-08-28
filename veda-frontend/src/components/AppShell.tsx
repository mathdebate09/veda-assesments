import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar, { HamburgerButton } from "@/components/Sidebar";
import { useSidebar } from "@/context/SidebarContext";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function AppShell({ children, title, showBack }: AppShellProps) {
  const navigate = useNavigate();
  const { userInfo, isOpen, setIsOpen } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-full">
        <Sidebar
          collapsed={!isOpen}
          onToggle={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* ── Mobile drawer sidebar ───────────────────────────────────────── */}
      <div className="lg:hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top nav */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-white/70 backdrop-blur-md border-b border-white/60 shrink-0">
          <div className="flex items-center gap-3 text-[14px] text-[#6b6b6b]">
            {/* Hamburger – mobile only */}
            <HamburgerButton onClick={() => setMobileOpen(true)} />

            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {title && (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#c0c0c0]">
                  <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <span className="text-[#1a1a1a] font-medium">{title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0] text-[13px]">?</button>
            <div className="relative">
              <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0]">
                <BellIcon />
              </button>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#FF5623] rounded-full" />
            </div>
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 12.5C1.5 12.5 3 9.5 7 9.5C11 9.5 12.5 12.5 12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
            <span className="hidden md:block text-[13px] font-medium text-[#1a1a1a]">
              {userInfo.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5C5.79 2.5 4 4.29 4 6.5V10L2.5 11.5H13.5L12 10V6.5C12 4.29 10.21 2.5 8 2.5Z" stroke="#6b6b6b" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.5 11.5C6.5 12.33 7.17 13 8 13C8.83 13 9.5 12.33 9.5 11.5" stroke="#6b6b6b" strokeWidth="1.3" />
    </svg>
  );
}
