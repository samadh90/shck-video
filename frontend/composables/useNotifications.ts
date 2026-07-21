import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useState } from '#app'
import { useAuth } from './useAuth'

export function useNotifications() {
  const router = useRouter()
  const { token } = useAuth()

  const notifications = useState('global_notifications', () => [])
  const unreadCount = useState('global_unread_notifications_count', () => 0)
  const showNotifs = useState('global_show_notifs', () => false)

  let pollInterval = null

  const fetchNotifications = async () => {
    if (!token.value) {
      notifications.value = []
      unreadCount.value = 0
      return
    }
    try {
      const data = await $fetch('http://localhost:4000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      notifications.value = data || []
      unreadCount.value = (data || []).filter((n: any) => !n.read).length
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
    }
  }

  const markNotifsRead = async () => {
    if (!token.value) return
    try {
      await $fetch('http://localhost:4000/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      notifications.value.forEach((n: any) => (n.read = true))
      unreadCount.value = 0
    } catch (err) {
      console.error(err)
    }
  }

  const handleNotifClick = async (n: any) => {
    if (!token.value) return
    try {
      if (!n.read) {
        await $fetch(`http://localhost:4000/api/notifications/${n.id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token.value}` }
        })
        n.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      showNotifs.value = false
      if (n.link) {
        router.push(n.link)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const startPolling = () => {
    fetchNotifications()
    if (!pollInterval && typeof window !== 'undefined') {
      pollInterval = setInterval(fetchNotifications, 15000)
    }
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    notifications,
    unreadCount,
    showNotifs,
    fetchNotifications,
    markNotifsRead,
    handleNotifClick,
    startPolling,
    stopPolling
  }
}
