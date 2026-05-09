'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { SINGLE_USER_ID } from '@/config/auth'

export async function getPostDraft(id: string) {
  const supabase = createClient()

  // Using hardcoded user ID - no authentication required
  const userId = SINGLE_USER_ID

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    console.error('Get Draft Error:', error)
    return { error: 'Failed to load draft.' }
  }

  return { post: data }
}

export async function savePostDraft(
  contentHtml: string,
  contentText: string,
  id?: string | null,
  visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
  scheduledAt?: string | null
) {
  if (!contentText.trim()) {
    return { error: 'Post content cannot be empty' }
  }

  const supabase = createClient()

  // Using hardcoded user ID - no authentication required
  const userId = SINGLE_USER_ID

  let scheduledDate = null
  if (scheduledAt) {
    scheduledDate = new Date(scheduledAt).toISOString()
  }

  // To maintain rich text, we persist the HTML content to the DB.
  let error;
  if (id) {
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        content: contentHtml,
        visibility: visibility,
        status: scheduledDate ? 'scheduled' : 'draft',
        scheduled_at: scheduledDate
      })
      .eq('id', id)
      .eq('user_id', userId)
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: contentHtml, // Storing HTML for Tiptap
        visibility: visibility,
        status: scheduledDate ? 'scheduled' : 'draft',
        scheduled_at: scheduledDate
      })
    error = insertError;
  }

  if (error) {
    console.error('Save Draft Error:', error)
    return { error: 'Failed to save draft. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/posts')
  
  return { success: true, postId: id } // Note: Need to return ID so we can publish if it was just created
}

export async function publishPostNow(
  contentHtml: string,
  contentText: string,
  visibility: 'PUBLIC' | 'CONNECTIONS',
  postId?: string | null
) {
  if (!contentText.trim()) return { error: 'Post content cannot be empty' }

  const supabase = createClient()

  // Using hardcoded user ID - no authentication required
  const userId = SINGLE_USER_ID

  // 1. Fetch LinkedIn Account Token & URN
  const { data: account, error: accError } = await supabase
    .from('social_accounts')
    .select('access_token, provider_account_id')
    .eq('user_id', userId)
    .eq('provider', 'linkedin')
    .single()

  if (accError || !account?.access_token || !account?.provider_account_id) {
    return { error: 'LinkedIn account not connected or missing URN. Please reconnect in Settings.' }
  }

  // 2. Publish to LinkedIn API v2/ugcPosts
  try {
    const urn = `urn:li:person:${account.provider_account_id}`
    
    // We only send text for now. If there were images, we'd need to upload them first.
    const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: urn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: contentText
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      })
    })

    if (!linkedInResponse.ok) {
      const errorData = await linkedInResponse.json()
      console.error('LinkedIn API Error:', errorData)
      return { error: `LinkedIn Publishing Failed: ${errorData.message || 'Unknown error'}` }
    }

  } catch (err: any) {
    console.error('Network Error during Publish:', err)
    return { error: 'Failed to contact LinkedIn servers.' }
  }

  // 3. Save as Published in DB
  const now = new Date().toISOString()
  if (postId) {
    await supabase.from('posts').update({
      content: contentHtml,
      status: 'published',
      visibility: visibility,
      published_at: now
    }).eq('id', postId).eq('user_id', userId)
  } else {
    await supabase.from('posts').insert({
      user_id: userId,
      content: contentHtml,
      status: 'published',
      visibility: visibility,
      published_at: now
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/posts')

  return { success: true }
}
