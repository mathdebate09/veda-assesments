import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import ExamsListPage from "@/pages/ExamsListPage";
import ExamDetailPage from "@/pages/ExamDetailPage";
import ClassroomsPage from "@/pages/ClassroomsPage";
import ClassroomDetailPage from "@/pages/ClassroomDetailPage";
import LoadingPage from "@/pages/LoadingPage";
import MappingPage from "@/pages/MappingPage";
import { SidebarProvider } from "@/context/SidebarContext";

export default function App() {
  return (
    <SidebarProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/exams" replace />} />
          <Route path="/exams" element={<ExamsListPage />} />
          <Route path="/exams/:examId" element={<ExamDetailPage />} />
          <Route path="/exams/:examId/upload" element={<ExamDetailPage />} />
          <Route path="/exams/:examId/loading" element={<LoadingPage />} />
          <Route
            path="/exams/:examId/answer-sheets/:sheetId/mapping"
            element={<MappingPage />}
          />
          <Route path="/classrooms" element={<ClassroomsPage />} />
          <Route path="/classrooms/:id" element={<ClassroomDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </SidebarProvider>
  );
}
