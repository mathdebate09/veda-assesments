import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { clearToken } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1 border-b border-[#eeeeee] py-4 last:border-b-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#999999]">{label}</dt>
            <dd className="text-[14px] font-medium text-[#1a1a1a]">{value || "Not available"}</dd>
        </div>
    );
}

export default function SettingsPage() {
    const navigate = useNavigate();
    const { userInfo } = useSidebar();

    function handleSignOut() {
        clearToken();
        navigate("/login", { replace: true });
    }

    return (
        <AppShell title="Settings">
            <div className="mx-auto w-full max-w-[760px]">
                <div className="mb-8">
                    <h1 className="text-[28px] font-bold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        Settings
                    </h1>
                    <p className="mt-1.5 text-[14px] text-[#6b6b6b]">Manage your account and institute details.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <section className="rounded-[16px] border border-[#eeeeee] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#303030] text-[15px] font-bold text-white">
                                {userInfo.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-[16px] font-bold text-[#1a1a1a]">User details</h2>
                                <p className="text-[12px] text-[#999999]">Your VedaAI account</p>
                            </div>
                        </div>
                        <dl>
                            <DetailRow label="Name" value={userInfo.name} />
                        </dl>
                    </section>

                    <section className="rounded-[16px] border border-[#eeeeee] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                        <div className="mb-3 flex items-center gap-3">
                            {userInfo.instituteLogo ? (
                                <img src={userInfo.instituteLogo} alt="" className="h-10 w-10 rounded-full border border-[#e8e8e8] object-cover" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0eb] text-[15px] font-bold text-[#FF5623]">
                                    {userInfo.instituteName.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h2 className="text-[16px] font-bold text-[#1a1a1a]">Institute details</h2>
                                <p className="text-[12px] text-[#999999]">Your school information</p>
                            </div>
                        </div>
                        <dl>
                            <DetailRow label="Institute" value={userInfo.instituteName} />
                            <DetailRow label="Location" value={userInfo.instituteLocation} />
                        </dl>
                    </section>
                </div>

                <section className="mt-5 rounded-[16px] border border-[#eeeeee] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <h2 className="text-[16px] font-bold text-[#1a1a1a]">Account actions</h2>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="mt-4 flex h-10 items-center justify-center rounded-[9px] border border-[#f0cfc5] px-4 text-[13px] font-semibold text-[#d94d25] transition-colors hover:bg-[#fff5f1]"
                    >
                        Sign out
                    </button>
                </section>
            </div>
        </AppShell>
    );
}
