import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { evaluationsApi } from '../lib/api'
import { CheckCircle, XCircle, TrendingUp, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

function MathText({ text, stripOptionPrefix = false }) {
  if (!text) return null
  let formatted = String(text)

  // Hapus awalan "A) ", "B. ", dll. dari teks AI agar tidak dobel dengan label A., B., C., D.
  if (stripOptionPrefix) {
    formatted = formatted.replace(/^[A-Da-d][\)\.]\s*/, '')
  }

  formatted = formatted
    // 1. Ubah \[ ... \] dan \( ... \) menjadi $$ ... $$ dan $ ... $ tanpa spasi pinggir
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(\s*(.*?)\s*\\\)/g, '$$$1$$')
    // 2. Hapus spasi tepat setelah $ pembuka atau sebelum $ penutup
    .replace(/\$\s+([^$\n]+?)\s*\$/g, '$$$1$$')
    .replace(/\$\s*([^$\n]+?)\s+\$/g, '$$$1$$')

  // 3. Bungkus otomatis dengan $...$ jika opsi berisi notasi matematika tanpa pembatas $
  if (
    !formatted.includes('$') &&
    /(\\[a-zA-Z]+|\^|_)/.test(formatted)
  ) {
    formatted = `$${formatted.trim()}$`
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span className="inline">{children}</span>,
      }}
    >
      {formatted}
    </ReactMarkdown>
  )
}


export default function EvaluationPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [evalData, setEvalData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    evaluationsApi.get(bookingId).then((r) => {
      const data = r.data
      setEvalData(data)
      if (data.report) {
        setReport(data.report)
        setSubmitted(true)
      }
    }).finally(() => setLoading(false))
  }, [bookingId])

  const handleSubmit = async () => {
    const answerList = evalData.questions.map((q) => answers[q.id] || '')
    setSubmitting(true)
    try {
      const res = await evaluationsApi.submit(bookingId, answerList)
      setReport(res.data.report)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Memuat evaluasi...</div>

  if (!evalData || evalData.status === 'belum_ada') {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-medium text-gray-500">Evaluasi belum tersedia</h3>
        <p className="text-sm text-gray-400 mt-1">Tandai sesi selesai dulu di halaman booking.</p>
        <button onClick={() => navigate('/student/bookings')} className="btn-secondary mt-4 text-sm">
          ← Kembali ke Booking
        </button>
      </div>
    )
  }

  // Show report
  if (submitted && report) {
    const scoreDiff = (report.skor_sesudah || 0) - (report.skor_sebelum || 0)
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/student/bookings')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
          <h1 className="font-bold text-gray-900">Post-Class Learning Report</h1>
        </div>

        {/* Score banner */}
        <div className="card p-5 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Perkembangan Nilaimu</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-400">{report.skor_sebelum}</span>
                <TrendingUp className={`w-6 h-6 ${scoreDiff >= 0 ? 'text-green-500' : 'text-red-400'}`} />
                <span className="text-3xl font-bold text-blue-600">{report.skor_sesudah}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Sebelum → Sesudah sesi</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${scoreDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {scoreDiff >= 0 ? '+' : ''}{scoreDiff}
              </div>
              <div className="text-xs text-gray-400">peningkatan</div>
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">📚 Ringkasan Materi</h3>
            <div className="text-sm text-gray-600">
              <MathText text={report.ringkasan_materi} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card p-4">
              <h3 className="font-semibold text-green-700 mb-2 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Sudah Dikuasai
              </h3>
              <ul className="space-y-1">
                {report.topik_dikuasai?.map((t, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span><MathText text={t} /></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <h3 className="font-semibold text-orange-600 mb-2 text-sm flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Perlu Diperkuat
              </h3>
              <ul className="space-y-1">
                {report.topik_perlu_diperkuat?.map((t, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <span className="text-orange-400 mt-0.5">!</span>
                    <span><MathText text={t} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-blue-700 mb-2 text-sm">🎯 Rekomendasi Sesi Berikutnya</h3>
            <div className="text-sm text-gray-600">
              <MathText text={report.rekomendasi_sesi_berikutnya} />
            </div>
          </div>

          {report.pesan_semangat && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">💪 {report.pesan_semangat}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show questions
  const questions = evalData.questions || []
  const allAnswered = questions.every((q) => answers[q.id])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/student/bookings')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
        <div>
          <h1 className="font-bold text-gray-900">Evaluasi Pasca Sesi</h1>
          <p className="text-sm text-gray-500">Jawab {questions.length} soal untuk mendapatkan laporan perkembanganmu</p>
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="card p-4">
            <div className="flex items-start gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                {i + 1}
              </span>
              <div className="text-sm font-medium text-gray-800">
                <MathText text={q.pertanyaan} />
              </div>
            </div>
            {q.tipe === 'pilihan_ganda' && q.pilihan ? (
              <div className="space-y-2">
                {q.pilihan.map((p, pi) => {
                  const letter = ['A', 'B', 'C', 'D'][pi]
                  return (
                    <label
                      key={pi}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                        ${answers[q.id] === letter
                          ? 'bg-blue-50 border border-blue-300'
                          : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={letter}
                        checked={answers[q.id] === letter}
                        onChange={() => setAnswers({ ...answers, [q.id]: letter })}
                        className="accent-blue-600"
                      />
                      <span className="text-xs font-medium text-gray-500 w-4">{letter}.</span>
                      <span className="text-sm text-gray-700">
                        <MathText text={p} />
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <textarea
                className="input text-sm resize-none"
                rows={2}
                placeholder="Tulis jawabanmu di sini..."
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Memproses Jawaban...' : 'Kirim Jawaban & Lihat Laporan'}
        </button>
      </div>
    </div>
  )
}
