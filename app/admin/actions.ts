'use server'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function deleteFamily(familyId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('family_links').delete().eq('id', familyId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
