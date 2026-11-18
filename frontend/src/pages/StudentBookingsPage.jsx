import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi, evaluationsApi } from '../lib/api'
import { StatusBadge } from '../components/ui/Badge'
import { Calendar, BookOpen, ChevronRight, FileText } from 'lucide-react'

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingsApi.list().then((r) => {
      setBookings(r.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm p-4">Memuat booking...</div>

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-medium text-gray-500">Belum ada booking</h3>
        <p className="text-sm text-gray-400 mt-1">Cari tutor dulu lewat AI Chat!</p>
        <Link to="/student" className="btn-primary inline-block mt-4 text-sm">
          Mulai AI Chat
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-bold text-gray-900 mb-4">Booking Saya</h1>
      <div className="space-y-3">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onRefresh={() => bookingsApi.list().then(r => setBookings(r.data))} />
        ))}
      </div>
    </div>
  )
}

function BookingCard({ booking: b, onRefresh }) {
  const [completing, setCompleting] = useState(false)
  const [generatingEval, setGeneratingEval] = useState(false)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await bookingsApi.complete(b.id)
      onRefresh()
    } finally {
      setCompleting(false)
    }
  }

  const handleGenerateEval = async () => {
    setGeneratingEval(true)
    try {
      await evaluationsApi.generate(b.id)
      onRefresh()
    } finally {
      setGeneratingEval(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{b.tutor_name}</span>
            <StatusBadge status={b.status} />
          </div>
          <p className="text-sm text-blue-700 font-medium mt-0.5">{b.mata_kuliah}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{b.topik}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {b.jadwal_dipilih}
            </span>
            <span className="capitalize">{b.mode}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {b.status === 'diterima' && !b.has_brief && (
          <span className="text-xs text-gray-400 italic">Learning brief sedang disiapkan tutor...</span>
        )}
        {b.has_brief && (
          <Link
            to={`/student/bookings/${b.id}`}
            className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
          >
            <FileText className="w-3 h-3" />
            Lihat Learning Brief
          </Link>
        )}
        {b.status === 'diterima' && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="text-xs btn-secondary py-1 px-3"
          >
            {completing ? 'Memproses...' : '✅ Tandai Selesai'}
          </button>
        )}
        {b.status === 'selesai' && !b.has_evaluation && (
          <button
            onClick={handleGenerateEval}
            disabled={generatingEval}
            className="text-xs btn-primary py-1 px-3"
          >
            {generatingEval ? 'Menyiapkan soal...' : '📝 Mulai Evaluasi'}
          </button>
        )}
        {b.status === 'selesai' && b.has_evaluation && (
          <Link
            to={`/student/evaluations/${b.id}`}
            className="text-xs btn-primary py-1 px-3"
          >
            {b.has_report ? '📊 Lihat Laporan' : '📝 Kerjakan Evaluasi'}
          </Link>
        )}
      </div>
    </div>
  )
}
