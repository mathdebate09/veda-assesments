import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { clearToken } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import vedaLogo from "@/assets/logos/vedaai.png";

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2.25 7.5L9 2.25L15.75 7.5V15.75C15.75 16.1642 15.4142 16.5 15 16.5H11.25V11.25H6.75V16.5H3C2.58579 16.5 2.25 16.1642 2.25 15.75V7.5Z"
        stroke={active ? "#1a1a1a" : "#6b6b6b"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClassroomIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.25" y="3.375" width="13.5" height="10.125" rx="1.5" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.4" />
      <path d="M5.625 15.75H12.375" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 13.5V15.75" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.625 7.875H12.375M5.625 10.125H10.125" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function AssignmentsIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3.375" y="1.688" width="11.25" height="14.625" rx="1.5" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.4" />
      <path d="M6.188 6.188H11.813M6.188 9H11.813M6.188 11.813H9.563" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ExamIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.4" />
      <path d="M5.625 6.75H12.375M5.625 9H12.375M5.625 11.25H9" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.75 2.25V5.25M11.25 2.25V5.25" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.75" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.4" />
      <path d="M9 6.75V9.563L11.25 11.25" stroke={active ? "#1a1a1a" : "#6b6b6b"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#6b6b6b" strokeWidth="1.3" />
      <path d="M13 8C13 8.35 12.97 8.69 12.92 9.03L14.54 10.29L13.04 12.71L11.11 12.06C10.65 12.41 10.13 12.69 9.57 12.87L9.28 14.9H6.72L6.43 12.87C5.87 12.69 5.35 12.41 4.89 12.06L2.96 12.71L1.46 10.29L3.08 9.03C3.03 8.69 3 8.35 3 8C3 7.65 3.03 7.31 3.08 6.97L1.46 5.71L2.96 3.29L4.89 3.94C5.35 3.59 5.87 3.31 6.43 3.13L6.72 1.1H9.28L9.57 3.13C10.13 3.31 10.65 3.59 11.11 3.94L13.04 3.29L14.54 5.71L12.92 6.97C12.97 7.31 13 7.65 13 8Z" stroke="#6b6b6b" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 8C7 8 8 7 8 3C8 7 9 8 13 8C9 8 8 9 8 13C8 9 7 8 3 8Z" fill="#FF5623" />
      <path d="M0.5 4C2.5 4 3 3.5 3 1.5C3 3.5 3.5 4 5.5 4C3.5 4 3 4.5 3 6.5C3 4.5 2.5 4 0.5 4Z" fill="#FF5623" />
    </svg>
  );
}

function ChevronDoubleRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 11.5L7.5 8L3.5 4.5" stroke="#6b6b6b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 11.5L12.5 8L8.5 4.5" stroke="#6b6b6b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 6.5H19M3 11H19M3 15.5H19" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5L15 15M15 5L5 15" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home", to: "/exams", icon: HomeIcon },
  { label: "My Classroom", to: "/classrooms", icon: ClassroomIcon },
  { label: "Assignments", to: "/assignments", icon: AssignmentsIcon },
  { label: "Exams", to: "/exams", icon: ExamIcon, exact: true },
  { label: "My Library", to: "/library", icon: LibraryIcon },
];

// ─── Sidebar (expanded) ───────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  /** If true, render as an overlay drawer on mobile */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const { userInfo } = useSidebar();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  if (collapsed) {
    return <CollapsedSidebar onToggle={onToggle} userInfo={userInfo} />;
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen !== undefined && (
        <div
          className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          flex flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.07)] z-40
          rounded-r-[20px] h-full
          ${mobileOpen !== undefined
            ? `fixed top-0 left-0 w-[230px] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:flex`
            : "relative w-[230px] shrink-0"
          }
        `}
      >
        {/* Header: Logo + collapse btn */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src={vedaLogo} alt="VedaAI" className="w-8 h-8 rounded-[8px] object-cover" />
            <span className="font-bold text-[#1a1a1a] text-[16px] tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              VedaAI
            </span>
          </div>
          {/* Collapse / close button */}
          {mobileOpen !== undefined ? (
            <button
              onClick={onMobileClose}
              className="w-7 h-7 flex items-center justify-center text-[#9b9b9b] hover:text-[#1a1a1a] rounded-[6px] hover:bg-[#f5f5f5] transition-colors lg:hidden"
            >
              <CloseIcon />
            </button>
          ) : (
            onToggle && (
              <button
                onClick={onToggle}
                className="w-7 h-7 flex items-center justify-center text-[#9b9b9b] hover:text-[#1a1a1a] rounded-[6px] hover:bg-[#f5f5f5] transition-colors"
                title="Collapse sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M6 2V14" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            )
          )}
        </div>

        {/* AI Teacher's Toolkit CTA */}
        <div className="px-4 mb-5 shrink-0">
          <button className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-[#303030] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#1a1a1a] transition-colors" style={{ fontFamily: "Arial, sans-serif" }}>
            <SparkleIcon />
            AI Teacher&apos;s Toolkit
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/exams" || to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
                  isActive
                    ? "bg-[#f5f5f5] text-[#1a1a1a] font-semibold"
                    : "text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] font-medium"
                }`
              }
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings + User info */}
        <div className="px-4 py-4 shrink-0 flex flex-col gap-3">
          {/* Settings */}
          <button
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] rounded-[10px] hover:bg-[#f5f5f5] transition-colors w-full text-left"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            onClick={handleLogout}
          >
            <SettingsIcon />
            Settings
          </button>

          {/* User / Institute card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-[#f9f9f9] border border-[#f0f0f0]">
            {userInfo.instituteLogo ? (
              <img
                src={userInfo.instituteLogo}
                alt={userInfo.instituteName}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#e8e8e8]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#303030] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {userInfo.instituteName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {userInfo.instituteName}
              </p>
              <p className="text-[11px] text-[#9b9b9b] truncate">{userInfo.instituteLocation}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Collapsed sidebar (icon-only) ───────────────────────────────────────────

interface CollapsedSidebarProps {
  onToggle?: () => void;
  userInfo: { instituteName: string; instituteLogo?: string };
}

function CollapsedSidebar({ onToggle, userInfo }: CollapsedSidebarProps) {
  const navigate = useNavigate();
  return (
    <aside className="w-[56px] shrink-0 flex flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.07)] z-10 rounded-r-[20px] items-center py-4 gap-1">
      {/* Logo */}
      <div className="mb-3">
        <img src={vedaLogo} alt="VedaAI" className="w-9 h-9 rounded-[10px] object-cover" />
      </div>

      {/* AI Toolkit (just icon) */}
      <div className="w-9 h-9 rounded-full bg-[#303030] flex items-center justify-center mb-3">
        <SparkleIcon />
      </div>

      {/* Nav icons */}
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/exams" || to === "/"}
          title={label}
          className={({ isActive }) =>
            `w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors ${
              isActive ? "bg-[#f0f0f0] text-[#1a1a1a]" : "text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
            }`
          }
        >
          {({ isActive }) => <Icon active={isActive} />}
        </NavLink>
      ))}

      <div className="flex-1" />

      {/* Institute avatar */}
      {userInfo.instituteLogo ? (
        <img
          src={userInfo.instituteLogo}
          alt={userInfo.instituteName}
          className="w-9 h-9 rounded-full object-cover border border-[#e8e8e8] mb-1"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[#303030] flex items-center justify-center text-white text-[12px] font-bold mb-1">
          {userInfo.instituteName.charAt(0)}
        </div>
      )}

      {/* Expand toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          title="Expand sidebar"
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a] transition-colors"
        >
          <ChevronDoubleRight />
        </button>
      )}
    </aside>
  );
}

// ─── Mobile hamburger trigger button ─────────────────────────────────────────

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[8px] text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors"
      aria-label="Open menu"
    >
      <HamburgerIcon />
    </button>
  );
}
