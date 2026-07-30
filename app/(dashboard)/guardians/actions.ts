'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGuardian(formData: FormData) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please sign in again')
  }

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

  const { data, error } = await supabase
    .from('guardians')
    .insert(guardianData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create guardian: ${error.message}`)
  }

  revalidatePath('/guardians')
  return data
}

export async function linkStudentToGuardian(formData: FormData) {
  const supabase = await createServerClient()

  const linkData = {
    student_id: formData.get('student_id') as string,
    guardian_id: formData.get('guardian_id') as string,
    relationship: formData.get('relationship') as string,
    is_primary: formData.get('is_primary') === 'true',
  }

  const { error } = await supabase
    .from('student_guardians')
    .insert(linkData)

  if (error) {
    throw new Error('Failed to link student to guardian')
  }

  revalidatePath(`/guardians/${linkData.guardian_id}`)
}

export interface BulkGuardianRow {
  first_name: string
  middle_name?: string | null
  last_name: string
  email?: string | null
  phone: string
  whatsapp_number?: string | null
  alternate_phone?: string | null
  address: string
  occupation?: string | null
  relationship_type: string
}

export async function bulkImportGuardians(guardiansList: BulkGuardianRow[]) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Please sign in again' }
  }

  // Insert guardians
  const { data, error } = await supabase
    .from('guardians')
    .insert(
      guardiansList.map((g) => ({
        first_name: g.first_name,
        middle_name: g.middle_name || null,
        last_name: g.last_name,
        email: g.email || null,
        phone: g.phone,
        whatsapp_number: g.whatsapp_number || null,
        alternate_phone: g.alternate_phone || null,
        address: g.address,
        occupation: g.occupation || null,
        relationship_type: g.relationship_type || 'Father',
        is_emergency_contact: false,
      }))
    )
    .select()

  if (error) {
    console.error('Error inserting bulk guardians:', error)
    return { success: false, error: `Failed to import guardians: ${error.message}` }
  }

  revalidatePath('/guardians')
  return { success: true, count: data?.length || 0 }
}
