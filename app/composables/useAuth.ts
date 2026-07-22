import { useState } from '#app'
import type { AuthUser } from '#shared/types/models'

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const isAuthenticated = useState<boolean>('auth_is_authenticated', () => false)

  const setAuth = (newUser: AuthUser) => {
    isAuthenticated.value = true
    user.value = newUser
  }

  const clearAuth = () => {
    isAuthenticated.value = false
    user.value = null
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      clearAuth()
    }
  }

  const loadAuth = async (): Promise<boolean> => {
    try {
      const currentUser = await $fetch<AuthUser>('/api/users/me')
      setAuth(currentUser)
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  const setUser = (newUser: AuthUser) => {
    user.value = newUser
  }

  const requestEmailVerification = async (): Promise<{ success: boolean, developmentVerificationUrl?: string } | null> => {
    if (!isAuthenticated.value) return null
    try {
      return await $fetch<{ success: boolean, developmentVerificationUrl?: string }>('/api/auth/resend-verification', {
        method: 'POST'
      })
    } catch (err) {
      console.error(err)
      return null
    }
  }

  return {
    user,
    setAuth,
    setUser,
    requestEmailVerification,
    logout,
    loadAuth,
    isAuthenticated
  }
}
