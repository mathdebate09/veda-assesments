import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "@/lib/auth";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const NAV_ITEMS = [
  { label: "Home", to: "/exams", icon: HomeIcon },
  { label: "My Classroom", to: "/classrooms", icon: ClassroomIcon },
  { label: "Exams", to: "/exams", icon: ExamIcon },
];

export default function AppShell({ children, title }: AppShellProps) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="flex h-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5]">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.06)] z-10 rounded-r-[20px]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="w-8 h-8 bg-[#303030] rounded-[8px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L7 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-[#1a1a1a] text-[15px] tracking-tight">VedaAI</span>
        </div>

        {/* AI Teacher's Toolkit CTA */}
        <div className="px-4 mb-5">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#303030] text-white rounded-[10px] text-[13px] font-semibold">
            <span className="text-[#FF5623]">✦</span>
            AI Teacher's Toolkit
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/exams"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] transition-colors ${
                  isActive
                    ? "bg-[#f5f5f5] text-[#1a1a1a] font-semibold"
                    : "text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-[#f0f0f0]">
          <button
            onClick={handleLogout}
            className="w-full text-left text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] px-3 py-2 rounded-[10px] hover:bg-[#f5f5f5] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav */}
        <header className="h-14 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b border-white/60 shrink-0">
          <div className="flex items-center gap-2 text-[14px] text-[#6b6b6b]">
            {title && (
              <>
                <span className="text-[#1a1a1a] font-medium">{title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0] text-[13px]">?</button>
            <div className="relative">
              <button className="w-7 h-7 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f0f0f0]">
                <BellIcon />
              </button>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#FF5623] rounded-full" />
            </div>
            <div className="w-7 h-7 rounded-full bg-[#303030] flex items-center justify-center text-white text-[11px] font-bold">
              M
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 2L14 6.5V13.5C14 13.78 13.78 14 13.5 14H10V10H6V14H2.5C2.22 14 2 13.78 2 13.5V6.5Z" stroke="#6b6b6b" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ClassroomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="#6b6b6b" strokeWidth="1.3" />
      <path d="M5 13.5H11" stroke="#6b6b6b" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 12V13.5" stroke="#6b6b6b" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 6.5H11.5M4.5 8.5H9" stroke="#6b6b6b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ExamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="#6b6b6b" strokeWidth="1.3" />
      <path d="M5.5 5.5H10.5M5.5 8H10.5M5.5 10.5H8.5" stroke="#6b6b6b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
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
