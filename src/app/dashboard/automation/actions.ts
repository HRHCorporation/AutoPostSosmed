'use server'

import { createClient, SINGLE_USER_ID } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getAutomations() {
  const db = createClient()
  const { data } = await db
    .from('automations')
    .select('*')
    .eq('user_id', SINGLE_USER_ID)
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

export async function createAutomation(formData: FormData) {
  const db = createClient()
  const keyword = (formData.get('trigger_keyword') as string)?.trim()
  const message = (formData.get('dm_message') as string)?.trim()
  if (!keyword || !message) return

  await db.from('automations').insert({
    user_id: SINGLE_USER_ID,
    platform: 'instagram',
    trigger_keyword: keyword,
    dm_message: message,
    is_active: true,
  })
  revalidatePath('/dashboard/automation')
}

export async function toggleAutomation(id: string, isActive: boolean) {
  const db = createClient()
  await db.from('automations').update({ is_active: isActive }).eq('id', id).eq('user_id', SINGLE_USER_ID)
  revalidatePath('/dashboard/automation')
}

export async function deleteAutomation(id: string) {
  const db = createClient()
  await db.from('automations').delete().eq('id', id).eq('user_id', SINGLE_USER_ID)
  revalidatePath('/dashboard/automation')
}
