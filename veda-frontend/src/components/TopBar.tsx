import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/context/SidebarContext";
import { HamburgerButton } from "@/components/Sidebar";

interface TopBarProps {
    title?: ReactNode;
    showBack?: boolean;
    actions?: ReactNode;
    mobileMenuOpen?: () => void;
}

export default function TopBar({ title, showBack = false, actions, mobileMenuOpen }: TopBarProps) {
    const navigate = useNavigate();
    const { userInfo } = useSidebar();
    const [faqOpen, setFaqOpen] = useState(false);
    const [faqPinned, setFaqPinned] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const faqRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleDocumentClick(event: MouseEvent) {
            const target = event.target as Node;
            if (!faqRef.current?.contains(target)) setFaqOpen(false);
            if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setFaqOpen(false);
                setFaqPinned(false);
                setNotificationsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleDocumentClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleDocumentClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    function goBack() {
        if (window.history.length > 1) navigate(-1);
        else navigate("/");
    }

    const initials = userInfo.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="relative z-20 mx-3 mt-3 flex min-h-[54px] shrink-0 items-center justify-between rounded-[18px] border border-white/80 bg-white/85 px-3 shadow-[0_8px_24px_rgba(37,32,29,0.07)] backdrop-blur-md sm:mx-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-2 text-[14px] text-[#6b6b6b]">
                {mobileMenuOpen && <HamburgerButton onClick={mobileMenuOpen} />}
                {showBack && (
                    <button
                        type="button"
                        onClick={goBack}
                        aria-label="Go back"
                        title="Go back"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#303030] transition-colors hover:bg-[#f0f0f0]"
                    >
                        <ArrowLeftIcon />
                    </button>
                )}
                {title && (
                    <div className="flex min-w-0 items-center gap-2 truncate text-[#1a1a1a]">
                        <SectionIcon />
                        <span className="truncate font-medium">{title}</span>
                    </div>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {actions}
                <div
                    ref={faqRef}
                    className="relative"
                    onMouseEnter={() => setFaqOpen(true)}
                    onMouseLeave={() => {
                        if (!faqPinned) setFaqOpen(false);
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setFaqPinned((open) => !open);
                            setFaqOpen(true);
                        }}
                        aria-label="Frequently asked questions"
                        aria-expanded={faqOpen}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#303030] transition-colors hover:bg-[#f0f0f0]"
                    >
                        <QuestionIcon />
                    </button>
                    {faqOpen && (
                        <div className="absolute right-0 top-10 w-56 rounded-[12px] border border-[#ededed] bg-white p-4 text-[12px] text-[#9b9b9b] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                            <span className="sr-only">FAQ panel is empty</span>
                        </div>
                    )}
                </div>

                <div ref={notificationsRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setNotificationsOpen((open) => !open)}
                        aria-label="Notifications"
                        aria-expanded={notificationsOpen}
                        className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#303030] transition-colors hover:bg-[#f0f0f0]"
                    >
                        <BellIcon />
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF5623]" />
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 top-10 w-48 rounded-[12px] border border-[#ededed] bg-white p-4 text-center text-[12px] text-[#6b6b6b] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                            No notifications yet
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    aria-label={`Signed in as ${userInfo.name}`}
                    className="flex max-w-[180px] items-center gap-2 rounded-full py-1 pl-1 pr-1.5 text-left transition-colors hover:bg-[#f5f5f5]"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#303030] text-[10px] font-bold text-white">
                        {initials}
                    </span>
                    <span className="hidden truncate text-[13px] font-semibold text-[#303030] sm:block">{userInfo.name}</span>
                    <ChevronDownIcon />
                </button>
            </div>
        </header>
    );
}

function ArrowLeftIcon() {
    return <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M16 10H4M4 10L9 5M4 10L9 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SectionIcon() {
    return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 text-[#b0b0b0]"><rect x="2" y="1.5" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 5H10.5M4.5 7.5H10.5M4.5 10H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>;
}

function QuestionIcon() {
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.5" /><path d="M6.9 6.8C7.1 5.8 7.9 5.2 9 5.2C10.3 5.2 11.1 6 11.1 7.1C11.1 8.1 10.5 8.6 9.7 9.1C9.1 9.5 8.8 9.9 8.8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="8.8" cy="12.3" r=".7" fill="currentColor" /></svg>;
}

function BellIcon() {
    return <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M8 2.5C5.79 2.5 4 4.29 4 6.5V10L2.5 11.5H13.5L12 10V6.5C12 4.29 10.21 2.5 8 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6.5 11.5C6.5 12.33 7.17 13 8 13C8.83 13 9.5 12.33 9.5 11.5" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function ChevronDownIcon() {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="hidden text-[#6b6b6b] sm:block"><path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
