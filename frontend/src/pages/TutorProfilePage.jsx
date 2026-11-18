import { useEffect, useState } from 'react'
import { tutorsApi } from '../lib/api'
import useAuthStore from '../store/authStore'
import { Plus, X, Save } from 'lucide-react'

const JADWAL_OPTIONS = [
  'Senin 08:00-10:00', 'Senin 10:00-12:00', 'Senin 13:00-15:00', 'Senin 15:00-17:00', 'Senin 19:00-21:00',
  'Selasa 08:00-10:00', 'Selasa 15:00-17:00', 'Selasa 19:00-21:00',
  'Rabu 08:00-10:00', 'Rabu 15:00-17:00', 'Rabu 19:00-21:00',
  'Kamis 08:00-10:00', 'Kamis 15:00-18:00', 'Kamis 19:00-22:00',
  'Jumat 08:00-10:00', 'Jumat 15:00-18:00', 'Jumat 19:00-21:00',
  'Sabtu 09:00-12:00', 'Sabtu 13:00-16:00',
  'Minggu 09:00-12:00', 'Minggu 13:00-16:00',
]

export default function TutorProfilePage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    mata_kuliah: '', topik: [], harga_per_sesi: 25000,
    jadwal: [], mode: 'online', lokasi: '', bio: '',
  })
  const [topikInput, setTopikInput] = useState('')

  useEffect(() => {
    tutorsApi.getMe().then((r) => {
      setProfile(r.data)
      setForm({
        mata_kuliah: r.data.mata_kuliah || '',
        topik: r.data.topik || [],
        harga_per_sesi: r.data.harga_per_sesi || 25000,
        jadwal: r.data.jadwal || [],
        mode: r.data.mode || 'online',
        lokasi: r.data.lokasi || '',
        bio: r.data.bio || '',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const addTopik = () => {
    const t = topikInput.trim()
    if (t && !form.topik.includes(t)) {
      setForm({ ...form, topik: [...form.topik, t] })
    }
    setTopikInput('')
  }

  const removeTopik = (t) => {
    setForm({ ...form, topik: form.topik.filter((x) => x !== t) })
  }

  const toggleJadwal = (j) => {
    if (form.jadwal.includes(j)) {
      setForm({ ...form, jadwal: form.jadwal.filter((x) => x !== j) })
    } else {
      setForm({ ...form, jadwal: [...form.jadwal, j] })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await tutorsApi.updateMe(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Memuat profil...</div>

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-gray-900">Profil Tutor</h1>
        {profile?.is_verified && (
          <span className="badge badge-green">✅ Terverifikasi</span>
        )}
      </div>

      {/* Identity */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Identitas</h2>
        <div className="space-y-1 text-sm">
          <div><span className="text-gray-500">Nama:</span> {user?.name}</div>
          <div><span className="text-gray-500">Email:</span> {user?.email}</div>
          <div><span className="text-gray-500">Jurusan:</span> {user?.jurusan}</div>
          <div><span className="text-gray-500">Semester:</span> {user?.semester}</div>
        </div>
      </div>

      {/* Mata Kuliah */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Mata Kuliah Utama</h2>
        <select
          className="input"
          value={form.mata_kuliah}
          onChange={(e) => setForm({ ...form, mata_kuliah: e.target.value })}
        >
          <option value="">Pilih mata kuliah...</option>
          {['Matematika', 'Informatika', 'Statistika', 'Akuntansi', 'Fisika', 'Kimia', 'Ekonomi'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Topik */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Topik yang Dikuasai</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder="Tambah topik, e.g. Kalkulus Integral"
            value={topikInput}
            onChange={(e) => setTopikInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTopik()}
          />
          <button onClick={addTopik} className="btn-secondary px-3 py-2">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {form.topik.map((t) => (
            <span key={t} className="badge badge-blue flex items-center gap-1">
              {t}
              <button onClick={() => removeTopik(t)} className="ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Harga */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Harga per Sesi</h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Rp</span>
          <input
            type="number"
            className="input w-40"
            min={5000}
            max={200000}
            step={5000}
            value={form.harga_per_sesi}
            onChange={(e) => setForm({ ...form, harga_per_sesi: parseInt(e.target.value) })}
          />
          <span className="text-gray-500 text-sm">/sesi</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Rata-rata platform: Rp20.000–Rp35.000</p>
      </div>

      {/* Mode */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Mode Mengajar</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'online', label: '💻 Online' },
            { value: 'offline', label: '📍 Offline' },
            { value: 'both', label: '🔄 Keduanya' },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setForm({ ...form, mode: m.value })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors font-medium
                ${form.mode === m.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {form.mode !== 'online' && (
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Lokasi</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Misal: Sekitar kampus, Perpustakaan"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Jadwal */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Jadwal Tersedia</h2>
        <div className="flex flex-wrap gap-2">
          {JADWAL_OPTIONS.map((j) => (
            <button
              key={j}
              onClick={() => toggleJadwal(j)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                ${form.jadwal.includes(j)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Bio Singkat</h2>
        <textarea
          className="input text-sm resize-none"
          rows={3}
          placeholder="Ceritakan sedikit tentang pengalamanmu mengajar..."
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className={`btn-primary w-full flex items-center justify-center gap-2 ${saved ? 'bg-green-600' : ''}`}
      >
        <Save className="w-4 h-4" />
        {saved ? '✅ Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Profil'}
      </button>
    </div>
  )
}
