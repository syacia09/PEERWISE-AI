import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { authApi } from '../lib/api'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
    jurusan: '', semester: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        semester: form.semester ? parseInt(form.semester) : null,
      }
      const res = await authApi.register(payload)
      login(res.data.user, res.data.token)
      if (res.data.user.role === 'tutor') {
        navigate('/tutor/profile')
      } else {
        navigate('/student')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrasi gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-2 shadow">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Buat Akun PEERWISE</h1>
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                className="input"
                placeholder="Nama kamu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
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
              <input
                type="password"
                className="input"
                placeholder="Min. 8 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daftar sebagai</label>
              <div className="grid grid-cols-2 gap-2">
                {['student', 'tutor'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors
                      ${form.role === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {r === 'student' ? '👨‍🎓 Student' : '👩‍🏫 Tutor'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
              <input
                type="text"
                className="input"
                placeholder="Teknik Informatika"
                value={form.jurusan}
                onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input
                type="number"
                className="input"
                placeholder="3"
                min="1" max="14"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
