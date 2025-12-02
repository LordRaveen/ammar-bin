'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { devLog } from '@/lib/logger'

export async function createGuardian(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      devLog('Auth error:', authError)
      throw new Error('Unauthorized: Please sign in again')
    }

    devLog('Authenticated user:', user.email)

    const guardianData = {
      first_name: formData.get('first_name') as string,
      middle_name: formData.get('middle_name') as string || null,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string,
      whatsapp_number: formData.get('whatsapp_number') as string || null,
      alternate_phone: formData.get('alternate_phone') as string || null,
      address: formData.get('address') as string,
      occupation: formData.get('occupation') as string || null,
      relationship_type: formData.get('relationship_type') as string,
      is_emergency_contact: false,
    }

    devLog('Creating guardian:', guardianData)

    const { data, error } = await supabase
      .from('guardians')
      .insert(guardianData)
      .select()
      .single()

    if (error) {
      devLog('Error creating guardian:', error)
      throw new Error(`Failed to create guardian: ${error.message}`)
    }

    devLog('Guardian created successfully:', data)

    revalidatePath('/guardians')
    redirect('/guardians')
  } catch (error) {
    devLog('Unexpected error in createGuardian:', error)
    throw error
  }
}

export async function linkStudentToGuardian(formData: FormData) {
  const supabase = await createServerClient()

  const linkData = {
    student_id: formData.get('student_id') as string,
    guardian_id: formData.get('guardian_id') as string,
    relationship: formData.get('relationship') as string,
    is_primary: formData.get('is_primary') === 'true',
  }

  devLog('Linking student to guardian:', linkData)

  const { error } = await supabase
    .from('student_guardians')
    .insert(linkData)

  if (error) {
    devLog('Error linking student to guardian:', error)
    throw new Error('Failed to link student to guardian')
  }

  revalidatePath(`/guardians/${linkData.guardian_id}`)
  redirect(`/guardians/${linkData.guardian_id}`)
}
