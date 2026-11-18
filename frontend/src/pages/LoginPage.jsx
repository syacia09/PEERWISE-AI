import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../lib/api'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form.email, form.password)
      login(res.data.user, res.data.token)
      if (res.data.user.role === 'tutor') {
        navigate('/tutor')
      } else {
        navigate('/student')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login gagal, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    if (role === 'student') {
      setForm({ email: 'mahasiswa@demo.com', password: 'demo1234' })
    } else {
      setForm({ email: 'rina.aulia@demo.com', password: 'demo1234' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PEERWISE <span className="text-blue-600">AI</span></h1>
          <p className="text-gray-500 text-sm mt-1">Belajar bareng mahasiswa, lebih cerdas</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Masuk ke Akun</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="email@kampus.ac.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 text-center">Demo cepat:</p>
            <div className="flex gap-2">
              <button
                onClick={() => fillDemo('student')}
                className="flex-1 text-xs py-1.5 px-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                👨‍🎓 Isi sebagai Student
              </button>
              <button
                onClick={() => fillDemo('tutor')}
                className="flex-1 text-xs py-1.5 px-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50"
              >
                👩‍🏫 Isi sebagai Tutor
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
