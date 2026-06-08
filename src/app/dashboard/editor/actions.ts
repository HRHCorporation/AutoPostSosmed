'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertTokenValid } from '@/lib/linkedin'
import { publishToThreads, assertThreadsTokenValid } from '@/lib/threads'
import { publishToInstagram, assertInstagramTokenValid } from '@/lib/instagram'

export async function getConnectedPlatforms(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('social_accounts')
    .select('provider')
    .eq('user_id', user.id)
  return (data ?? []).map((a: any) => a.provider as string)
}

export async function getPostDraft(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return { error: 'Failed to load draft.' }
  return { post: data }
}

export async function savePostDraft(
  contentHtml: string,
  contentText: string,
  id?: string | null,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  scheduledAt?: string | null,
  platforms: string[] = ['linkedin'],
  imageUrl?: string | null
) {
  if (!contentText.trim()) return { error: 'Post content cannot be empty' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const scheduledDate = scheduledAt ? new Date(scheduledAt).toISOString() : null
  const platformsStr = platforms.length > 0 ? platforms.join(',') : 'linkedin'

  let error: any
  if (id) {
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        content: contentHtml,
        visibility,
        status: scheduledDate ? 'scheduled' : 'draft',
        scheduled_at: scheduledDate,
        platforms: platformsStr,
        image_url: imageUrl ?? null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: contentHtml,
        visibility,
        status: scheduledDate ? 'scheduled' : 'draft',
        scheduled_at: scheduledDate,
        platforms: platformsStr,
        image_url: imageUrl ?? null,
      })
    error = insertError
  }

  if (error) {
    console.error('Save Draft Error:', error)
    return { error: 'Failed to save draft. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/posts')
  return { success: true }
}

export async function publishPostNow(
  contentHtml: string,
  contentText: string,
  visibility: 'PUBLIC' | 'CONNECTIONS',
  platforms: string[],
  postId?: string | null,
  imageUrl?: string | null
) {
  if (!contentText.trim()) return { error: 'Post content cannot be empty' }
  if (platforms.length === 0) return { error: 'Select at least one platform' }

  if (platforms.includes('instagram') && !imageUrl?.trim()) {
    return { error: 'Instagram requires an image URL. Generate or paste one in the Instagram Image field.' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const errors: string[] = []

  // ── LinkedIn ──────────────────────────────────────────────
  if (platforms.includes('linkedin')) {
    const { data: account, error: accError } = await supabase
      .from('social_accounts')
      .select('id, access_token, provider_account_id, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'linkedin')
      .single()

    if (accError || !account?.access_token || !account?.provider_account_id) {
      errors.push('LinkedIn: account not connected. Please reconnect in Settings.')
    } else {
      try {
        assertTokenValid(account)
        const urn = `urn:li:person:${account.provider_account_id}`
        const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            author: urn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: contentText },
                shareMediaCategory: 'NONE',
              },
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': visibility },
          }),
        })
        if (!linkedInResponse.ok) {
          const err = await linkedInResponse.json()
          throw new Error(err.message ?? 'Unknown error')
        }
      } catch (e: any) {
        errors.push(`LinkedIn: ${e.message}`)
      }
    }
  }

  // ── Threads ───────────────────────────────────────────────
  if (platforms.includes('threads')) {
    const { data: account, error: accError } = await supabase
      .from('social_accounts')
      .select('id, access_token, provider_account_id, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'threads')
      .single()

    if (accError || !account?.access_token || !account?.provider_account_id) {
      errors.push('Threads: account not connected. Please reconnect in Settings.')
    } else {
      try {
        assertThreadsTokenValid(account)
        await publishToThreads(account.access_token, account.provider_account_id, contentText)
      } catch (e: any) {
        errors.push(`Threads: ${e.message}`)
      }
    }
  }

  // ── Instagram ─────────────────────────────────────────────
  if (platforms.includes('instagram') && imageUrl) {
    const { data: account, error: accError } = await supabase
      .from('social_accounts')
      .select('id, access_token, provider_account_id, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'instagram')
      .single()

    if (accError || !account?.access_token || !account?.provider_account_id) {
      errors.push('Instagram: account not connected. Please reconnect in Settings.')
    } else {
      try {
        assertInstagramTokenValid(account)
        await publishToInstagram(account.access_token, account.provider_account_id, contentText, imageUrl)
      } catch (e: any) {
        errors.push(`Instagram: ${e.message}`)
      }
    }
  }

  if (errors.length === platforms.length) {
    return { error: errors.join(' | ') }
  }

  // Save to DB (mark published even if one platform partially failed)
  const now = new Date().toISOString()
  const platformsStr = platforms.join(',')
  if (postId) {
    await supabase.from('posts').update({
      content: contentHtml,
      status: 'published',
      visibility,
      published_at: now,
      platforms: platformsStr,
      image_url: imageUrl ?? null,
    }).eq('id', postId).eq('user_id', user.id)
  } else {
    await supabase.from('posts').insert({
      user_id: user.id,
      content: contentHtml,
      status: 'published',
      visibility,
      published_at: now,
      platforms: platformsStr,
      image_url: imageUrl ?? null,
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/posts')

  if (errors.length > 0) {
    return { success: true, warning: `Published with errors: ${errors.join(' | ')}` }
  }
  return { success: true }
}
