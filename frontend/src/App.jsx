import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdmissionPortal from './pages/AdmissionPortal';
import ExamCellPortal from './pages/ExamCellPortal';
import AccountPortal from './pages/AccountPortal';
import AttendanceScanner from './pages/AttendanceScanner';

// Placeholder components for other portals
const Unauthorized = () => <div className="p-8 text-center bg-red-50 min-h-screen flex items-center justify-center"><h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter">403 | Forbidden Entry</h1></div>;

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/scan" element={<ProtectedRoute allowedRoles={['STUDENT']}><AttendanceScanner /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admission" element={<ProtectedRoute allowedRoles={['ADMISSION']}><AdmissionPortal /></ProtectedRoute>} />
            <Route path="/exam-cell" element={<ProtectedRoute allowedRoles={['EXAM']}><ExamCellPortal /></ProtectedRoute>} />
            <Route path="/account-section" element={<ProtectedRoute allowedRoles={['ACCOUNT']}><AccountPortal /></ProtectedRoute>} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
