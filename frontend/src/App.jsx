import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/ui/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AIChatPage from './pages/AIChatPage'
import StudentBookingsPage from './pages/StudentBookingsPage'
import EvaluationsListPage from './pages/EvaluationsListPage'
import EvaluationPage from './pages/EvaluationPage'
import TutorDashboardPage from './pages/TutorDashboardPage'
import TutorBookingsPage from './pages/TutorBookingsPage'
import TutorProfilePage from './pages/TutorProfilePage'

function ProtectedRoute({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'tutor' ? '/tutor' : '/student'} replace />
  }
  return children
}

function StudentLayout({ children }) {
  return (
    <ProtectedRoute role="student">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function TutorLayout({ children }) {
  return (
    <ProtectedRoute role="tutor">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  const { user } = useAuthStore()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'tutor' ? '/tutor' : '/student'} replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        user ? <Navigate to={user.role === 'tutor' ? '/tutor' : '/student'} replace /> : <RegisterPage />
      } />

      {/* Student routes */}
      <Route path="/student" element={<StudentLayout><AIChatPage /></StudentLayout>} />
      <Route path="/student/bookings" element={<StudentLayout><StudentBookingsPage /></StudentLayout>} />
      <Route path="/student/evaluations" element={<StudentLayout><EvaluationsListPage /></StudentLayout>} />
      <Route path="/student/evaluations/:bookingId" element={<StudentLayout><EvaluationPage /></StudentLayout>} />

      {/* Tutor routes */}
      <Route path="/tutor" element={<TutorLayout><TutorDashboardPage /></TutorLayout>} />
      <Route path="/tutor/bookings" element={<TutorLayout><TutorBookingsPage /></TutorLayout>} />
      <Route path="/tutor/profile" element={<TutorLayout><TutorProfilePage /></TutorLayout>} />

      {/* Root redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'tutor' ? '/tutor' : '/student'} replace />
          : <Navigate to="/login" replace />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
