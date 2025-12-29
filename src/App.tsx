import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import AdminDashboard from "./pages/admin/dashboard"
import StudentDashboard from "./pages/student/dashboard"
import LoginPage from "./pages/login"
import RegisterPage from "./pages/register"

import AlumnasList from "./pages/admin/alumnas/list"
import AddAlumna from "./pages/admin/alumnas/add"
import EditAlumna from "./pages/admin/alumnas/edit"
import AlumnaProfile from "./pages/admin/alumnas/view"

import PlansList from "./pages/admin/planes/list"
import AddPlan from "./pages/admin/planes/add"
import EditPlan from "./pages/admin/planes/edit"
import PlanView from "./pages/admin/planes/view"

import LandingPage from "./pages/landing"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/alumnas" element={<AlumnasList />} />
        <Route path="/admin/alumnas/nueva" element={<AddAlumna />} />
        <Route path="/admin/alumnas/editar/:id" element={<EditAlumna />} />
        <Route path="/admin/alumnas/perfil/:id" element={<AlumnaProfile />} />

        <Route path="/admin/planes" element={<PlansList />} />
        <Route path="/admin/planes/nuevo" element={<AddPlan />} />
        <Route path="/admin/planes/editar/:id" element={<EditPlan />} />
        <Route path="/admin/planes/ver/:id" element={<PlanView />} />

        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  )
}

export default App

