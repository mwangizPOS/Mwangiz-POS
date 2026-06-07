import dotenv from 'dotenv'

dotenv.config()

function parseCsv(value: string | undefined, fallback: string[]) {
  const items = value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items && items.length > 0 ? items : fallback
}

function parsePort(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 4000
}

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback
  }

  return ['1', 'true', 'yes', 'require', 'required'].includes(value.toLowerCase())
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL,
  databaseSsl: parseBoolean(process.env.DATABASE_SSL ?? process.env.PGSSLMODE),
  backendApiKey: process.env.BACKEND_API_KEY,
  corsOrigins: parseCsv(process.env.ELECTRON_APP_ORIGIN ?? process.env.CORS_ORIGINS, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]),
  mpesa: {
    environment: process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    callbackUrl: process.env.MPESA_CALLBACK_URL,
    callbackSecret: process.env.MPESA_CALLBACK_SECRET,
    transactionType: process.env.MPESA_TRANSACTION_TYPE ?? 'CustomerPayBillOnline',
  },
} as const

export function requireConfig(value: string | undefined, name: string) {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required.`)
  }

  return value
}

export function isProduction() {
  return env.nodeEnv === 'production'
}
