export default defineNuxtPlugin(async () => {
  // The HttpOnly cookie is intentionally unreadable from JavaScript.
  // Ask the server for the current session instead of restoring localStorage.
  await useAuth().loadAuth()
})
