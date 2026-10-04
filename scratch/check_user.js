import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers()
  if (err1) {
    console.error('Error listing auth users:', err1)
  } else {
    console.log('Auth users count:', users.users.length)
    const target = users.users.find(u => u.email?.includes('ibrahimmaharazu'))
    console.log('Target auth user:', target ? { id: target.id, email: target.email, user_metadata: target.user_metadata } : 'not found')
    if (target) {
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', target.id).maybeSingle()
      console.log('Target user_profiles:', profile)
      const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', target.id).maybeSingle()
      console.log('Target user_roles:', roles)
    }
  }

  // Also check all distinct roles in user_profiles and user_roles
  const { data: allProfiles } = await supabase.from('user_profiles').select('role, user_id, status').limit(20)
  console.log('Sample user_profiles:', allProfiles)
}

check()
