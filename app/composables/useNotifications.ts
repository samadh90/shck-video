import { useRouter } from 'vue-router'
import { useState } from '#app'
import { useAuth } from './useAuth'
import type { Notification, NotificationsResponse } from '#shared/types/models'

export function useNotifications() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const notifications = useState<Notification[]>('global_notifications', () => [])
  const unreadCount = useState<number>('global_unread_notifications_count', () => 0)
  const showNotifs = useState<boolean>('global_show_notifs', () => false)

  let pollInterval: ReturnType<typeof setInterval> | undefined

  const fetchNotifications = async () => {
    if (!isAuthenticated.value) {
      notifications.value = []
      unreadCount.value = 0
      return
    }
    try {
      const data = await $fetch<NotificationsResponse>('/api/notifications')
      notifications.value = data.notifications
      unreadCount.value = data.unreadCount
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
    }
  }

  const markNotifsRead = async () => {
    if (!isAuthenticated.value) return
    try {
      await $fetch('/api/notifications/read-all', { method: 'POST' })
      notifications.value.forEach((notification) => (notification.read = true))
      unreadCount.value = 0
    } catch (err) {
      console.error(err)
    }
  }

  const handleNotifClick = async (notification: Notification) => {
    if (!isAuthenticated.value) return
    try {
      if (!notification.read) {
        await $fetch('/api/notifications/read-all', { method: 'POST' })
        notification.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      showNotifs.value = false
      if (notification.link) {
        router.push(notification.link)
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
      pollInterval = undefined
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
