import { useState } from '#app'

export const useAuth = () => {
  const token = useState('auth_token', () => null)
  const user = useState('auth_user', () => null)

  const setAuth = (newToken, newUser) => {
    token.value = newToken
    user.value = newUser
    if (process.client) {
      localStorage.setItem('auth_token', newToken)
      localStorage.setItem('auth_user', JSON.stringify(newUser))
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    if (process.client) {
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
          user.value = JSON.parse(storedUser)
        } catch {
          logout()
        }
      }
    }
  }

  const setUser = (newUser) => {
    user.value = newUser
    if (process.client) {
      localStorage.setItem('auth_user', JSON.stringify(newUser))
    }
  }

  const verifyEmail = async () => {
    if (!token.value) return false
    try {
      const res = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      if (res.user) {
        setUser({ ...user.value, ...res.user })
      } else {
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
