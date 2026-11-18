import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tutorsApi } from '../lib/api'
import { Star, CheckCircle, Calendar, BookOpen, TrendingUp } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function TutorDashboardPage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      tutorsApi.getMe().catch(() => null),
      tutorsApi.getMyBookings().catch(() => []),
    ]).then(([profileRes, bookingsRes]) => {
      setProfile(profileRes?.data || null)
      setBookings(bookingsRes?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm p-4">Memuat dashboard...</div>

  const pending = bookings.filter(b => b.status === 'menunggu')
  const accepted = bookings.filter(b => b.status === 'diterima')
  const done = bookings.filter(b => b.status === 'selesai')

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="font-bold text-gray-900 text-lg">Halo, {user?.name}! 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Dashboard Tutor PEERWISE AI</p>
        {profile && (
          <div className="flex items-center gap-4 mt-3">
            <div className="text-center">
              <div className="font-bold text-xl text-blue-600">{profile.jumlah_sesi}</div>
              <div className="text-xs text-gray-500">Total Sesi</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 font-bold text-xl text-yellow-500">
                <Star className="w-5 h-5 fill-yellow-400" />
                {profile.rating}
              </div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-green-600">{done.length}</div>
              <div className="text-xs text-gray-500">Selesai</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pending.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Menunggu</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{accepted.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Aktif</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{done.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Selesai</div>
        </div>
      </div>

      {/* Pending bookings */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">🔔 Permintaan Baru ({pending.length})</h2>
            <Link to="/tutor/bookings" className="text-xs text-blue-600 hover:underline">Lihat semua</Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 2).map((b) => (
              <PendingBookingCard key={b.id} booking={b} onAction={() => tutorsApi.getMyBookings().then(r => setBookings(r.data))} />
            ))}
          </div>
        </div>
      )}

      {/* Profile CTA */}
      {!profile && (
        <div className="card p-4 border-dashed border-2 border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-700 font-medium">Profil tutormu belum lengkap!</p>
          <p className="text-xs text-blue-500 mt-1">Tambahkan keahlian dan jadwalmu agar bisa ditemukan student.</p>
          <Link to="/tutor/profile" className="btn-primary text-xs mt-3 inline-block">Lengkapi Profil</Link>
        </div>
      )}
    </div>
  )
}

function PendingBookingCard({ booking: b, onAction }) {
  const [loading, setLoading] = useState('')

  const handle = async (action) => {
    setLoading(action)
    try {
      await tutorsApi.handleBooking(b.id, action)
      onAction()
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-medium text-sm text-gray-900">{b.student_name}</span>
          <span className="text-xs text-gray-400 ml-2">{b.student_jurusan}, sem {b.student_semester}</span>
          <p className="text-xs text-blue-600 font-medium mt-0.5">{b.mata_kuliah}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{b.topik}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {b.jadwal_dipilih} · {b.mode}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handle('terima')}
          disabled={loading !== ''}
          className="flex-1 text-xs btn-primary py-1.5 disabled:opacity-50"
        >
          {loading === 'terima' ? '...' : '✅ Terima'}
        </button>
        <button
          onClick={() => handle('tolak')}
          disabled={loading !== ''}
          className="flex-1 text-xs btn-danger py-1.5 disabled:opacity-50"
        >
          {loading === 'tolak' ? '...' : '❌ Tolak'}
        </button>
      </div>
    </div>
  )
}
