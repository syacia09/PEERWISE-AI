import { useNavigate, useLocation, Link } from 'react-router-dom'
import { BookOpen, MessageSquare, Calendar, LogOut, User, GraduationCap } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const studentNav = [
    { path: '/student', icon: MessageSquare, label: 'AI Chat' },
    { path: '/student/bookings', icon: Calendar, label: 'Booking Saya' },
    { path: '/student/evaluations', icon: BookOpen, label: 'Evaluasi' },
  ]

  const tutorNav = [
    { path: '/tutor', icon: User, label: 'Dashboard' },
    { path: '/tutor/bookings', icon: Calendar, label: 'Permintaan Masuk' },
    { path: '/tutor/profile', icon: GraduationCap, label: 'Profil Tutor' },
  ]

  const navItems = user?.role === 'tutor' ? tutorNav : studentNav

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={user?.role === 'tutor' ? '/tutor' : '/student'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">PEERWISE <span className="text-blue-600">AI</span></span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {user?.name}
              <span className="ml-1 text-xs text-blue-600 font-medium">
                ({user?.role === 'tutor' ? 'Tutor' : 'Student'})
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-4 gap-4">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col gap-1 w-48 shrink-0">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === path
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors
                ${location.pathname === path ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
