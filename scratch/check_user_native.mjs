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

  // 1. Check user_profiles for ibrahimmaharazu
  const resProfiles = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*`, { headers })
  const profiles = await resProfiles.json()
  console.log('--- ALL USER PROFILES ---')
  console.log(profiles)

  // 2. Check user_roles
  const resRoles = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=*`, { headers })
  const roles = await resRoles.json()
  console.log('--- ALL USER ROLES ---')
  console.log(roles)

  // 3. Auth users list via Supabase admin auth API
  const resAuth = await fetch(`${supabaseUrl}/auth/v1/admin/users`, { headers })
  const authUsers = await resAuth.json()
  console.log('--- AUTH USERS ---')
  if (authUsers.users) {
    for (const u of authUsers.users) {
      console.log(`User: ${u.id}, Email: ${u.email}, metadata:`, u.user_metadata)
    }
  } else {
    console.log(authUsers)
  }
}

main().catch(console.error)
