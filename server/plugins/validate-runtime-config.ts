export default defineNitroPlugin(() => {
  const { jwtSecret } = useRuntimeConfig()

  if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET est requis et doit contenir au moins 32 caracteres.')
  }
})
