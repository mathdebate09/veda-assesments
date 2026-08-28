import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import LandingPage from "@/pages/LandingPage";
import HomePage from "@/pages/HomePage";
import ExamsListPage from "@/pages/ExamsListPage";
import ExamDetailPage from "@/pages/ExamDetailPage";
import ClassroomsPage from "@/pages/ClassroomsPage";
import ClassroomDetailPage from "@/pages/ClassroomDetailPage";
import LoadingPage from "@/pages/LoadingPage";
import MappingPage from "@/pages/MappingPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import LibraryPage from "@/pages/LibraryPage";
import SettingsPage from "@/pages/SettingsPage";
import { SidebarProvider } from "@/context/SidebarContext";

export default function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LandingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
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
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
}
