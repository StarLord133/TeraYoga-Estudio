import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import AdminDashboard from "./pages/admin/dashboard"
import StudentDashboard from "./pages/student/dashboard"
import LoginPage from "./pages/login"

import AlumnasList from "./pages/admin/alumnas/list"
import AddAlumna from "./pages/admin/alumnas/add"
import EditAlumna from "./pages/admin/alumnas/edit"
import AlumnaProfile from "./pages/admin/alumnas/view"

import PlansList from "./pages/admin/planes/list"
import AddPlan from "./pages/admin/planes/add"
import EditPlan from "./pages/admin/planes/edit"
import PlanView from "./pages/admin/planes/view"

import LandingPage from "./pages/landing"
import AuthActionHandler from "./pages/auth-handler"
import AdminLoginPage from "./pages/admin-login"
import KioscoPage from "./pages/admin/kiosco"
import AsistenciasList from "./pages/admin/asistencias/list"
import ProfesoresList from "./pages/admin/profesores/list"
import HorariosPage from "./pages/admin/horarios/list"
import { AuthGuard } from "./components/auth-guard"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/auth/action" element={<AuthActionHandler />} />
        <Route path="/admin" element={<Navigate to="/admin/inicio" replace />} />
        <Route path="/admin/inicio" element={<AuthGuard requireRole="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/alumnas" element={<AuthGuard requireRole="admin"><AlumnasList /></AuthGuard>} />
        <Route path="/admin/alumnas/nueva" element={<AuthGuard requireRole="admin"><AddAlumna /></AuthGuard>} />
        <Route path="/admin/alumnas/editar/:id" element={<AuthGuard requireRole="admin"><EditAlumna /></AuthGuard>} />
        <Route path="/admin/alumnas/perfil/:id" element={<AuthGuard requireRole="admin"><AlumnaProfile /></AuthGuard>} />
        <Route path="/admin/asistencias" element={<AuthGuard requireRole="admin"><AsistenciasList /></AuthGuard>} />
        <Route path="/admin/kiosco" element={<AuthGuard requireRole="admin"><KioscoPage /></AuthGuard>} />

        <Route path="/admin/planes" element={<AuthGuard requireRole="admin"><PlansList /></AuthGuard>} />
        <Route path="/admin/planes/nuevo" element={<AuthGuard requireRole="admin"><AddPlan /></AuthGuard>} />
        <Route path="/admin/planes/editar/:id" element={<AuthGuard requireRole="admin"><EditPlan /></AuthGuard>} />
        <Route path="/admin/planes/ver/:id" element={<AuthGuard requireRole="admin"><PlanView /></AuthGuard>} />

        <Route path="/admin/profesores" element={<AuthGuard requireRole="admin"><ProfesoresList /></AuthGuard>} />
        <Route path="/admin/horarios" element={<AuthGuard requireRole="admin"><HorariosPage /></AuthGuard>} />

        <Route path="/student" element={<AuthGuard requireRole="student"><StudentDashboard /></AuthGuard>} />
        <Route path="/dashboard" element={<Navigate to="/admin/inicio" replace />} />
      </Routes>
    </Router>
  )
}

export default App

