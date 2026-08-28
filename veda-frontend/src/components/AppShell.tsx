import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSidebar } from "@/context/SidebarContext";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function AppShell({ children, title, showBack }: AppShellProps) {
  const { isOpen, setIsOpen } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <div className="hidden h-full p-3 lg:flex">
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
        <TopBar
          title={title}
          showBack={showBack ?? true}
          mobileMenuOpen={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
