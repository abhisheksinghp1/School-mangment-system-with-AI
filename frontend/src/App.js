import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Auth
import Login from './pages/Login';

// Role Dashboards
import StudentDashboard    from './pages/StudentDashboard';
import TeacherDashboard    from './pages/TeacherDashboard';
import ParentDashboard     from './pages/ParentDashboard';
import ManagementDashboard from './pages/ManagementDashboard';

// Shared modules
import AttendancePage     from './pages/AttendancePage';
import HomeworkPage       from './pages/HomeworkPage';
import MarksPage          from './pages/MarksPage';
import NotificationsPage  from './pages/NotificationsPage';
import AIChat             from './pages/AIChat';

// Management-only modules
import StudentsPage  from './pages/StudentsPage';
import TeachersPage  from './pages/TeachersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SalaryPage    from './pages/SalaryPage';

import './App.css';

const PR = ({ children }) => <PrivateRoute>{children}</PrivateRoute>;

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Role dashboards */}
        <Route path="/student-dashboard"    element={<PR><StudentDashboard /></PR>} />
        <Route path="/teacher-dashboard"    element={<PR><TeacherDashboard /></PR>} />
        <Route path="/parent-dashboard"     element={<PR><ParentDashboard /></PR>} />
        <Route path="/management-dashboard" element={<PR><ManagementDashboard /></PR>} />

        {/* Shared modules (all roles) */}
        <Route path="/attendance"     element={<PR><AttendancePage /></PR>} />
        <Route path="/homework"       element={<PR><HomeworkPage /></PR>} />
        <Route path="/marks"          element={<PR><MarksPage /></PR>} />
        <Route path="/notifications"  element={<PR><NotificationsPage /></PR>} />
        <Route path="/ai-chat"        element={<PR><AIChat /></PR>} />

        {/* Management-only */}
        <Route path="/students"   element={<PR><StudentsPage /></PR>} />
        <Route path="/teachers"   element={<PR><TeachersPage /></PR>} />
        <Route path="/analytics"  element={<PR><AnalyticsPage /></PR>} />
        <Route path="/salary"     element={<PR><SalaryPage /></PR>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
