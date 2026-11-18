import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pw_user') || 'null'),
  token: localStorage.getItem('pw_token') || null,

  login: (user, token) => {
    localStorage.setItem('pw_token', token)
    localStorage.setItem('pw_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('pw_token')
    localStorage.removeItem('pw_user')
    set({ user: null, token: null })
  },

  isStudent: () => {
    const state = useAuthStore.getState()
    return state.user?.role === 'student'
  },

  isTutor: () => {
    const state = useAuthStore.getState()
    return state.user?.role === 'tutor'
  },
}))

export default useAuthStore
