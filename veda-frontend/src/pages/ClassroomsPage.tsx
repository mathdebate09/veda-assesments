import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { getClassrooms, type Classroom } from "@/lib/api";

export default function ClassroomsPage() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getClassrooms()
      .then(setClassrooms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="My Classroom">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">My Classrooms</h1>
          <p className="text-[13px] text-[#6b6b6b] mt-0.5">Manage your students and classroom exams</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-[#9b9b9b] text-[14px]">
            <SpinnerIcon /> <span className="ml-2">Loading classrooms…</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] px-5 py-4 text-[14px] text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && classrooms.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="14" rx="2" stroke="#b0b0b0" strokeWidth="1.5" />
                <path d="M7 20H17M12 18V20" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 9H17M7 12H13" stroke="#b0b0b0" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#1a1a1a]">No classrooms yet</p>
            <p className="text-[13px] text-[#9b9b9b] mt-1">Classrooms are created from the backend</p>
          </div>
        )}

        {!loading && !error && classrooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((cls) => (
              <button
                key={cls._id}
                onClick={() => navigate(`/classrooms/${cls._id}`)}
                className="text-left bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all border border-transparent hover:border-[#e8e8e8]"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-[10px] bg-[#f5f5f5] flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#6b6b6b" strokeWidth="1.3" />
                    <path d="M5 15H13M9 13V15" stroke="#6b6b6b" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M5 7H13M5 9.5H9" stroke="#6b6b6b" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                </div>

                <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-1">{cls.name}</h3>

                {(cls.standard || cls.subject) && (
                  <p className="text-[13px] text-[#6b6b6b] mb-3">
                    {[cls.standard, cls.subject].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {cls.studentCount !== undefined && (
                    <span className="text-[11px] font-medium px-2.5 py-1 bg-[#f5f5f5] text-[#6b6b6b] rounded-full">
                      {cls.studentCount} students
                    </span>
                  )}
                  {cls.examCount !== undefined && (
                    <span className="text-[11px] font-medium px-2.5 py-1 bg-[#f5f5f5] text-[#6b6b6b] rounded-full">
                      {cls.examCount} exams
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="#9b9b9b" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#9b9b9b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
