import { NavLink } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import sparkleIcon from "@/assets/sidebar/sparkle.svg";

const vedaLogo = "https://ik.imagekit.io/jayowiee/assessments/veda-ai/logo.png";

// ─── Icons ────────────────────────────────────────────────────────────────────

type SidebarIconProps = { active?: boolean };

function HomeIcon({ active }: SidebarIconProps) {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5 shrink-0" viewBox="0 0 20 20" fill="none">
      <path d="M11.667 2.5h5.832v5.833h-5.832zM2.5 2.5h5.833v5.833H2.5zM11.667 11.667h5.832V17.5h-5.832zM2.5 11.667h5.833V17.5H2.5z" stroke="currentColor" strokeOpacity={active ? 1 : 0.8} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClassroomIcon({ active }: SidebarIconProps) {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5 shrink-0" viewBox="0 0 20 14" fill="none">
      <path d="M1.995 0h16.01C19.107 0 20 .867 20 1.937v10.126c0 .744-.431 1.389-1.064 1.714-.125-.387-.273-.84-.479-1.456-.08-.278-.106-.428-.16-.568-.08-.12-.203-.264-.319-.407l-.027-.032c-.401-.475-.911-1.087-1.343-1.614-.415-.505-.757-.932-.891-1.046-.32-.271-.771-.568-1.45-.568H9.668a3.1 3.1 0 0 1-.253-.065 30 30 0 0 1-2.048-.844c-1.153-1.174-2.018-2.057-2.594-2.648l-.346-.359c-.224-.234-.597-.258-.85-.055a.59.59 0 0 0-.094.812c1.808 2.279 2.735 3.442 2.781 3.489.112.114.444.327.851.594.42.275.919.606 1.303.865.358.241.559.31.599.646.088.741.194 1.856.319 3.345H1.995C.893 14 0 13.133 0 12.063V1.937C0 .867.893 0 1.995 0Z" fill="currentColor" fillOpacity={active ? 1 : 0.8} />
      <circle cx="12.473" cy="5.308" r="2.313" fill="white" />
    </svg>
  );
}

function AssignmentsIcon({ active }: SidebarIconProps) {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5 shrink-0" viewBox="0 0 20 20" fill="none">
      <path d="M5.25 2.25h6.5l4 4v11.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12.5a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeOpacity={active ? 1 : 0.8} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M11.75 2.5v4h3.75M7.25 10h5.5M7.25 13.25h4" stroke="currentColor" strokeOpacity={active ? 1 : 0.8} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExamIcon({ active }: SidebarIconProps) {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5 shrink-0" viewBox="0 0 20 20" fill="none">
      <path d="M6.25 3.25h7.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeOpacity={active ? 1 : 0.8} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.5 3.25V2h5v1.25M7.5 8h5M7.5 11h5M7.5 14h3" stroke="currentColor" strokeOpacity={active ? 1 : 0.8} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon({ active }: SidebarIconProps) {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5 shrink-0" viewBox="0 0 20 20" fill="none">
      <path d="M17.675 13.241a8.33 8.33 0 1 1-11.009-10.884M18.333 10A8.333 8.333 0 0 0 10 1.667V10h8.333Z" stroke="currentColor" strokeOpacity={active ? 1 : 0.8} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
  { label: "Home", to: "/home", icon: HomeIcon },
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
  const { userInfo } = useSidebar();

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
          rounded-[20px] h-full
          ${mobileOpen !== undefined
            ? `fixed top-0 left-0 w-[250px] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:flex`
            : "relative w-[250px] shrink-0"
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
          <button
            className="w-full rounded-full bg-linear-to-b from-[#fd8965] to-[#c26143] p-1 text-white shadow-[0_2px_4px_rgba(194,97,67,0.28)] transition-shadow hover:shadow-[0_3px_6px_rgba(194,97,67,0.38)]"
            aria-label="Open AI Teacher's Toolkit"
          >
            <span
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#303030] px-4 py-2 font-medium transition-colors hover:bg-[#1a1a1a]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <img src={sparkleIcon} alt="" className="h-4.5 w-4.75 shrink-0" />
              AI Teacher&apos;s Toolkit
            </span>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${isActive
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
          <NavLink
            to="/settings"
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#6b6b6b] hover:text-[#1a1a1a] rounded-[10px] hover:bg-[#f5f5f5] transition-colors w-full text-left"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            <SettingsIcon />
            Settings
          </NavLink>

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
  return (
    <aside className="w-[56px] shrink-0 flex flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.07)] z-10 rounded-[20px] items-center py-4 gap-1">
      {/* Logo */}
      <div className="mb-3">
        <img src={vedaLogo} alt="VedaAI" className="w-9 h-9 rounded-[10px] object-cover" />
      </div>

      {/* AI Toolkit (just icon) */}
      <div className="mb-3 rounded-full bg-linear-to-b from-[#fd8965] to-[#c26143] p-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#303030]">
          <img src={sparkleIcon} alt="AI Teacher's Toolkit" className="h-[18px] w-[19px]" />
        </div>
      </div>

      {/* Nav icons */}
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/exams" || to === "/"}
          title={label}
          className={({ isActive }) =>
            `w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors ${isActive ? "bg-[#f0f0f0] text-[#1a1a1a]" : "text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
            }`
          }
        >
          {({ isActive }) => <Icon active={isActive} />}
        </NavLink>
      ))}

      <div className="flex-1" />

      {/* Settings */}
      <NavLink
        to="/settings"
        title="Settings"
        className={({ isActive }) =>
          `w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors ${isActive ? "bg-[#f0f0f0] text-[#1a1a1a]" : "text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
          }`
        }
      >
        <SettingsIcon />
      </NavLink>

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
