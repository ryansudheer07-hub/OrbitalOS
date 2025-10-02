import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_ROOT = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const API_BASE_URL = `${API_ROOT}/api/v1`

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        // Simulate login for now
        setTimeout(() => {
          set({
            user: { email, id: 1 },
            token: 'fake-token',
            isLoading: false
          })
        }, 1000)
        return { success: true }
      },

      register: async (email, password, role) => {
        set({ isLoading: true })
        // Simulate registration for now
        setTimeout(() => {
          set({
            user: { email, id: 1, role },
            token: 'fake-token',
            isLoading: false
          })
        }, 1000)
        return { success: true }
      },

      logout: () => {
        set({ user: null, token: null })
      },

      checkAuth: async () => {
        // For now, just set loading to false
        set({ isLoading: false })
      },
    }),
    {
      name: 'orbitalos-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
