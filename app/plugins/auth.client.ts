export default defineNuxtPlugin(() => {
  // Restore the local session before route components mount.
  useAuth().loadAuth()
})
