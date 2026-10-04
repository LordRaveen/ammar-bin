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

async function main() {
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  }

  const userId = '9e7847a7-cd0b-4af2-98df-90a8aedd001f'

  const resTeachers = await fetch(`${supabaseUrl}/rest/v1/teachers?user_id=eq.${userId}&select=*`, { headers })
  const teacher = await resTeachers.json()
  console.log('Teacher record for principal:', teacher)

  const resProfiles = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=*`, { headers })
  const profile = await resProfiles.json()
  console.log('User profile for principal:', profile)
}

main().catch(console.error)
