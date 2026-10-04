import fs from 'fs'
import crypto from 'crypto'

const envContent = fs.readFileSync('.env', 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ''
    value = value.trim().replace(/^['"](.*)['"]$/, '$1')
    env[match[1]] = value
  }
}

const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const jwtSecret = env.SUPABASE_JWT_SECRET
const userId = '9e7847a7-cd0b-4af2-98df-90a8aedd001f' // Principal

function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${b64(header)}.${b64(payload)}`
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

const payload = {
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600,
  sub: userId,
  email: 'ibrahimmaharazu99@gmail.com',
  role: 'authenticated',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { role: 'principal' }
}

const token = createJWT(payload, jwtSecret)

async function testRLS() {
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const tables = ['students', 'classes', 'teachers', 'school_settings', 'student_results', 'invoices']
  for (const table of tables) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=2`, { headers })
    const data = await res.json()
    console.log(`Table ${table}: status=${res.status}, items=${Array.isArray(data) ? data.length : JSON.stringify(data)}`)
  }
}

testRLS().catch(console.error)
