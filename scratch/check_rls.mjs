import fs from 'fs'

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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

async function checkRLS() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  }

  // Check if principal user can query classes, students, teachers using their own token or user_id
  // Let's get the principal user: ibrahimmaharazu99@gmail.com
  const resAuth = await fetch(`${supabaseUrl}/auth/v1/admin/users`, { headers })
  const authUsers = await resAuth.json()
  const principal = authUsers.users?.find(u => u.email === 'ibrahimmaharazu99@gmail.com')
  console.log('Principal auth:', principal?.id, principal?.email)

  // In Supabase server-side client:
  // Let's check how createClient works in lib/supabase/server.ts
}

checkRLS().catch(console.error)
