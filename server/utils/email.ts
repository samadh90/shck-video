import nodemailer from 'nodemailer'
import { createError } from 'h3'

const verificationLifetimeMs = 24 * 60 * 60 * 1000

export const getVerificationTokenExpiry = (): string => {
  return new Date(Date.now() + verificationLifetimeMs).toISOString()
}

const getEmailConfig = () => {
  const config = useRuntimeConfig()
  const emailConfig = config.email
  const smtpPort = Number(emailConfig.smtpPort)

  if (!emailConfig.smtpHost || !emailConfig.smtpUser || !emailConfig.smtpPassword || !emailConfig.from || !Number.isInteger(smtpPort)) {
    if (import.meta.dev) {
      return null
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'La vérification par e-mail n’est pas configurée sur ce serveur.'
    })
  }

  return { emailConfig, smtpPort }
}

export const sendVerificationEmail = async (email: string, token: string): Promise<string | null> => {
  const smtpConfig = getEmailConfig()
  const appUrl = smtpConfig?.emailConfig.appUrl || 'http://localhost:3000'

  const verificationUrl = new URL('/verify-email', appUrl)
  verificationUrl.searchParams.set('token', token)

  if (!smtpConfig) {
    console.warn(`[development] Verification link for ${email}: ${verificationUrl.toString()}`)
    return `${verificationUrl.pathname}${verificationUrl.search}`
  }

  const { emailConfig, smtpPort } = smtpConfig

  const transport = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailConfig.smtpUser,
      pass: emailConfig.smtpPassword
    }
  })

  await transport.sendMail({
    from: emailConfig.from,
    to: email,
    subject: 'Vérifiez votre adresse e-mail SHCK Video',
    text: `Confirmez votre adresse e-mail : ${verificationUrl.toString()}`,
    html: `<p>Confirmez votre adresse e-mail :</p><p><a href="${verificationUrl.toString()}">Vérifier mon adresse e-mail</a></p><p>Ce lien expire dans 24 heures.</p>`
  })

  return null
}
