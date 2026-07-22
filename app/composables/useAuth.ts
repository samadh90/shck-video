import { useState } from '#app'
import type { AuthUser } from '#shared/types/models'

export const useAuth = () => {
  const token = useState<string | null>('auth_token', () => null)
  const user = useState<AuthUser | null>('auth_user', () => null)

  const setAuth = (newToken: string, newUser: AuthUser) => {
    token.value = newToken
    user.value = newUser
    if (import.meta.client) {
      localStorage.setItem('auth_token', newToken)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  const loadAuth = () => {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      if (storedToken && storedUser) {
        try {
          token.value = storedToken
          user.value = JSON.parse(storedUser) as AuthUser
        } catch {
          logout()
        }
      }
    }
  }

  const setUser = (newUser: AuthUser) => {
    user.value = newUser
    if (import.meta.client) {
      localStorage.setItem('auth_user', JSON.stringify(newUser))
    }
  }

  const requestEmailVerification = async (): Promise<{ success: boolean, developmentVerificationUrl?: string } | null> => {
    if (!token.value) return null
    try {
      return await $fetch<{ success: boolean, developmentVerificationUrl?: string }>('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
    } catch (err) {
      console.error(err)
      return null
    }
  }

  return {
    token,
    user,
    setAuth,
    setUser,
    requestEmailVerification,
    logout,
    loadAuth,
    isAuthenticated: () => !!token.value
  }
}
