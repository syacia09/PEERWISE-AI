import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../lib/api'

export default function EvaluationsListPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingsApi.list().then((r) => {
      // Show only completed bookings
      setBookings(r.data.filter(b => b.status === 'selesai'))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm p-4">Memuat evaluasi...</div>

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="font-medium text-gray-500">Belum ada evaluasi</h3>
        <p className="text-sm text-gray-400 mt-1">Evaluasi tersedia setelah sesi belajar selesai.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-bold text-gray-900 mb-4">Evaluasi Saya</h1>
      <div className="space-y-3">
        {bookings.map((b) => (
          <EvalCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  )
}

function EvalCard({ booking: b }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-sm text-gray-900">{b.tutor_name}</span>
          <p className="text-sm text-blue-700 font-medium">{b.mata_kuliah}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{b.topik}</p>
        </div>
        <div className="text-right shrink-0">
          {b.has_report ? (
            <span className="badge badge-green">✅ Selesai</span>
          ) : b.has_evaluation ? (
            <span className="badge badge-yellow">📝 Belum dikerjakan</span>
          ) : (
            <span className="badge badge-gray">Belum ada soal</span>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        {(b.has_evaluation || b.has_report) && (
          <Link
            to={`/student/evaluations/${b.id}`}
            className="text-xs btn-primary py-1.5 px-4 inline-block"
          >
            {b.has_report ? '📊 Lihat Laporan' : '📝 Kerjakan'}
          </Link>
        )}
      </div>
    </div>
  )
}
