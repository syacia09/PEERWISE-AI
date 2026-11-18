import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Inject token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pw_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pw_token')
      localStorage.removeItem('pw_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
}

// ─── Tutors ──────────────────────────────────────────────────────────────────
export const tutorsApi = {
  list: () => api.get('/tutors/'),
  getMe: () => api.get('/tutors/me'),
  updateMe: (data) => api.put('/tutors/me', data),
  getMyBookings: () => api.get('/tutors/me/bookings'),
  handleBooking: (bookingId, action) =>
    api.post(`/tutors/me/bookings/${bookingId}/action`, { action }),
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (data) => api.post('/bookings/', data),
  list: () => api.get('/bookings/'),
  get: (id) => api.get(`/bookings/${id}`),
  complete: (id) => api.post(`/bookings/${id}/complete`),
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (message, sessionId) => api.post('/chat/', { message, session_id: sessionId }),
  history: (sessionId) => api.get('/chat/history', { params: { session_id: sessionId } }),
  newSession: () => api.post('/chat/new-session'),
}

// ─── Evaluations ─────────────────────────────────────────────────────────────
export const evaluationsApi = {
  generate: (bookingId) => api.post(`/evaluations/${bookingId}/generate`),
  submit: (bookingId, answers) => api.post(`/evaluations/${bookingId}/submit`, { answers }),
  get: (bookingId) => api.get(`/evaluations/${bookingId}`),
}

// ─── Briefs ──────────────────────────────────────────────────────────────────
export const briefsApi = {
  generate: (bookingId) => api.post(`/briefs/${bookingId}/generate`),
  get: (bookingId) => api.get(`/briefs/${bookingId}`),
}

export default api
