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

  const verifyEmail = async () => {
    if (!token.value) return false
    try {
      const res = await $fetch<{ user?: AuthUser }>('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      if (res.user) {
        setUser(res.user)
      } else if (user.value) {
        setUser({ ...user.value, isVerified: true })
      }
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  return {
    token,
    user,
    setAuth,
    setUser,
    verifyEmail,
    logout,
    loadAuth,
    isAuthenticated: () => !!token.value
  }
}
