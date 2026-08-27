import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExam } from "@/lib/api";
import LoadingState from "@/imports/LoadingState/index";

export default function LoadingPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <div className="size-full">
      <LoadingState />
    </div>
  );
}
