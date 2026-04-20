import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { ResearchAssistantPage } from "../pages/ResearchAssistantPage";
import { RegisterPage } from "../pages/RegisterPage";

import "../styles/global.css";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ResearchAssistantPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
