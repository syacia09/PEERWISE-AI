import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Send, Plus, Star, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { chatApi, bookingsApi } from '../lib/api'
import useAuthStore from '../store/authStore'

const formatMathText = (text) => {
  if (!text) return ''
  return text
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
}

function TutorCard({ tutor, onBook, rank }) {
  const [booking, setBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [booked, setBooked] = useState(false)

  const handleBook = async () => {
    if (!selectedSlot) return
    setBooking(true)
    try {
      await onBook(tutor, selectedSlot)
      setBooked(true)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className={`border rounded-xl p-4 bg-white transition-all ${rank === 1 ? 'border-blue-400 shadow-md' : 'border-gray-200 shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{tutor.name}</h3>
            {rank === 1 && (
              <span className="badge bg-blue-600 text-white text-xs">🏆 Paling Sesuai</span>
            )}
            {tutor.is_verified
              ? <span className="badge bg-green-100 text-green-700">✅ Terverifikasi</span>
              : <span className="badge bg-yellow-100 text-yellow-700">⚠️ Belum Terverifikasi</span>
            }
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Semester {tutor.semester} · {tutor.mata_kuliah}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-blue-700 font-bold text-sm">Skor {tutor.score}/100</div>
          <div className="flex items-center gap-1 text-yellow-500 text-xs mt-0.5 justify-end">
            <Star className="w-3 h-3 fill-yellow-400" />
            <span className="text-gray-600">{tutor.rating} ({tutor.jumlah_sesi} sesi)</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <span className="font-medium">💰</span>
          <span>Rp{tutor.harga_per_sesi?.toLocaleString('id')}/sesi</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{tutor.mode === 'online' ? '💻' : tutor.mode === 'offline' ? '📍' : '🔄'}</span>
          <span className="capitalize">{tutor.mode}</span>
        </div>
        {tutor.lokasi && (
          <div className="flex items-center gap-1 col-span-2">
            <MapPin className="w-3 h-3" />
            <span>{tutor.lokasi}</span>
          </div>
        )}
      </div>

      {/* Topik */}
      <div className="flex flex-wrap gap-1 mb-3">
        {tutor.topik?.slice(0, 4).map((t, i) => (
          <span key={i} className="badge badge-blue">{t}</span>
        ))}
      </div>

      {/* Jadwal selector */}
      {!booked && (
        <>
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Pilih jadwal:</label>
            <select
              className="input text-xs"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <option value="">-- Pilih slot --</option>
              {tutor.jadwal?.map((j, i) => (
                <option key={i} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="btn-primary w-full text-sm py-2 disabled:opacity-40"
          >
            {booking ? 'Memproses...' : '📅 Pesan Tutor Ini'}
          </button>
        </>
      )}

      {booked && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm">
          <CheckCircle className="w-4 h-4" />
          Booking terkirim! Menunggu konfirmasi tutor.
        </div>
      )}
    </div>
  )
}

function TutorResultsBlock({ tutors, mata_kuliah, topik, mode, onBook }) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">3 Tutor Terbaik untukmu</p>
      {tutors.map((tutor, i) => (
        <TutorCard
          key={tutor.tutor_id}
          tutor={tutor}
          rank={i + 1}
          onBook={(t, slot) => onBook(t, slot, mata_kuliah, topik, mode)}
        />
      ))}
    </div>
  )
}

function ChatMessage({ msg, onBook }) {
  const isUser = msg.role === 'user'
  const tutorResults = msg.metadata?.result?.results

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5 text-xs font-bold text-white">
          P
        </div>
      )}
      <div className="max-w-[85%]">
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {formatMathText(msg.content)}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {/* Show tutor cards if search result */}
        {!isUser && tutorResults?.length > 0 && (
          <TutorResultsBlock
            tutors={tutorResults}
            mata_kuliah={msg.metadata?.result?.params?.mata_kuliah}
            topik={msg.metadata?.result?.params?.topik?.join(', ')}
            mode={msg.metadata?.result?.params?.mode}
            onBook={onBook}
          />
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center shrink-0 ml-2 mt-0.5 text-xs font-bold text-gray-600">
          S
        </div>
      )}
    </div>
  )
}

export default function AIChatPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await chatApi.history()
        setSessionId(res.data.session_id)
        if (res.data.messages?.length > 0) {
          // Rehydrate metadata from history
          setMessages(res.data.messages)
        } else {
          // Welcome message
          setMessages([{
            role: 'assistant',
            content: `Halo **${user?.name}**! 👋 Aku **PEERWISE Agent** — siap bantu kamu nemuin tutor yang paling pas.\n\nCeritain aja mata kuliah apa yang lagi bikin kepala pusing, dan aku akan cariin tutor terbaik buat kamu. 😊`,
          }])
        }
      } catch {
        setMessages([{
          role: 'assistant',
          content: 'Halo! 👋 Ceritain mata kuliah apa yang lagi kamu perjuangin sekarang?',
        }])
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatApi.send(text, sessionId)
      const { message, tool_result, session_id } = res.data
      if (!sessionId) setSessionId(session_id)

      const assistantMsg = {
        role: 'assistant',
        content: message,
        metadata: tool_result,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Maaf, ada kendala teknis. Coba lagi ya! 🙏',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (tutor, slot, mata_kuliah, topik, mode) => {
    await bookingsApi.create({
      tutor_id: tutor.tutor_id,
      mata_kuliah: mata_kuliah || tutor.mata_kuliah,
      topik: topik || tutor.topik?.join(', '),
      jadwal_dipilih: slot,
      mode: mode || tutor.mode,
    })
  }

  const handleNewSession = async () => {
    const res = await chatApi.newSession()
    setSessionId(res.data.session_id)
    setMessages([{
      role: 'assistant',
      content: 'Sesi baru dimulai! 🌟 Ada yang bisa aku bantu?',
    }])
  }

  const quickStarters = [
    'Aku kesulitan Kalkulus Integral, anggaran Rp30.000, offline sekitar kampus',
    'Tolong cariin tutor Struktur Data yang online, budget Rp25.000',
    'Mau belajar Statistika Dasar sebelum UTS minggu depan',
  ]

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Memuat percakapan...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)]">
      {/* Chat header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="font-bold text-gray-900">AI Chat</h1>
          <p className="text-xs text-gray-500">Ceritain kesulitanmu, aku cariin tutor terbaik</p>
        </div>
        <button
          onClick={handleNewSession}
          className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          Sesi Baru
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-container pr-1">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} onBook={handleBook} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 text-xs font-bold text-white">
              P
            </div>
            <div className="chat-bubble-assistant">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick starters (shown if only 1 message) */}
      {messages.length <= 1 && (
        <div className="shrink-0 mb-2">
          <p className="text-xs text-gray-400 mb-1.5">Coba mulai dengan:</p>
          <div className="flex flex-col gap-1.5">
            {quickStarters.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-left text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-100"
              >
                💬 {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 mt-2">
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder="Ketik pesanmu di sini..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-3 py-2 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
