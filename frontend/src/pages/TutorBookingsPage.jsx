import { useEffect, useState } from 'react'
import { tutorsApi, briefsApi } from '../lib/api'
import { StatusBadge } from '../components/ui/Badge'
import { Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function TutorBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    tutorsApi.getMyBookings().then((r) => setBookings(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  if (loading) return <div className="text-gray-400 text-sm p-4">Memuat permintaan...</div>

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-medium text-gray-500">Belum ada permintaan booking</h3>
        <p className="text-sm text-gray-400 mt-1">Pastikan profil tutormu sudah lengkap ya!</p>
      </div>
    )
  }

  const grouped = {
    menunggu: bookings.filter(b => b.status === 'menunggu'),
    diterima: bookings.filter(b => b.status === 'diterima'),
    selesai: bookings.filter(b => b.status === 'selesai'),
    ditolak: bookings.filter(b => b.status === 'ditolak'),
  }

  return (
    <div>
      <h1 className="font-bold text-gray-900 mb-4">Permintaan Booking</h1>

      {grouped.menunggu.length > 0 && (
        <Section title={`🔔 Menunggu Konfirmasi (${grouped.menunggu.length})`}>
          {grouped.menunggu.map(b => <BookingCard key={b.id} booking={b} onRefresh={refresh} />)}
        </Section>
      )}
      {grouped.diterima.length > 0 && (
        <Section title={`✅ Aktif (${grouped.diterima.length})`}>
          {grouped.diterima.map(b => <BookingCard key={b.id} booking={b} onRefresh={refresh} />)}
        </Section>
      )}
      {grouped.selesai.length > 0 && (
        <Section title={`🎓 Selesai (${grouped.selesai.length})`}>
          {grouped.selesai.map(b => <BookingCard key={b.id} booking={b} onRefresh={refresh} />)}
        </Section>
      )}
      {grouped.ditolak.length > 0 && (
        <Section title={`Ditolak (${grouped.ditolak.length})`} collapsed>
          {grouped.ditolak.map(b => <BookingCard key={b.id} booking={b} onRefresh={refresh} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed)
  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

function BookingCard({ booking: b, onRefresh }) {
  const [loading, setLoading] = useState('')
  const [briefOpen, setBriefOpen] = useState(false)
  const [generatingBrief, setGeneratingBrief] = useState(false)

  const handle = async (action) => {
    setLoading(action)
    try {
      await tutorsApi.handleBooking(b.id, action)
      onRefresh()
    } finally {
      setLoading('')
    }
  }

  const handleGenerateBrief = async () => {
    setGeneratingBrief(true)
    try {
      await briefsApi.generate(b.id)
      onRefresh()
    } finally {
      setGeneratingBrief(false)
    }
  }

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{b.student_name}</span>
            <StatusBadge status={b.status} />
          </div>
          <p className="text-xs text-gray-500">{b.student_jurusan} · Semester {b.student_semester}</p>
        </div>
      </div>

      <p className="text-sm text-blue-700 font-medium">{b.mata_kuliah}</p>
      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{b.topik}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {b.jadwal_dipilih}
        </span>
        <span className="capitalize">{b.mode}</span>
      </div>
      {b.catatan && (
        <p className="text-xs text-gray-400 italic mt-1">"{b.catatan}"</p>
      )}

      {/* Learning Brief */}
      {b.status === 'diterima' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {b.learning_brief ? (
            <div>
              <button
                onClick={() => setBriefOpen(!briefOpen)}
                className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
              >
                <FileText className="w-3 h-3" />
                {briefOpen ? 'Sembunyikan' : 'Lihat'} Learning Brief
              </button>
              {briefOpen && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-gray-700 space-y-2">
                  <div>
                    <span className="font-medium text-blue-700">Murid:</span>{' '}
                    {b.learning_brief.murid?.nama || b.student_name}
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Target:</span>{' '}
                    {b.learning_brief.mata_kuliah_target}
                  </div>
                  {b.learning_brief.topik_prioritas && (
                    <div>
                      <span className="font-medium text-blue-700">Topik Prioritas:</span>
                      <ol className="list-decimal list-inside mt-1 space-y-0.5">
                        {b.learning_brief.topik_prioritas.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {b.learning_brief.saran_fokus_sesi && (
                    <div>
                      <span className="font-medium text-blue-700">Saran Fokus:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {b.learning_brief.saran_fokus_sesi.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGenerateBrief}
              disabled={generatingBrief}
              className="text-xs flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
            >
              <FileText className="w-3 h-3" />
              {generatingBrief ? 'Menyiapkan brief...' : '+ Generate Learning Brief'}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      {b.status === 'menunggu' && (
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
      )}
    </div>
  )
}
