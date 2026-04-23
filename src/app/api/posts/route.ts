import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { publishLinkedInPost, addLinkedInComment } from '@/utils/linkedin'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, content, first_comment, status, scheduled_at } = await req.json()

    let postId = id
    let publishData = null

    // 1. If status is 'published', we try to publish to LinkedIn first
    if (status === 'published') {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('access_token, provider_user_id')
        .eq('user_id', user.id)
        .eq('provider', 'linkedin')
        .single()

      if (!account?.access_token || !account?.provider_user_id) {
        return NextResponse.json({ error: 'LinkedIn account not connected' }, { status: 400 })
      }

      const linkedinPostUrn = await publishLinkedInPost(
        account.access_token,
        account.provider_user_id,
        content
      )

      if (first_comment) {
        try {
          await addLinkedInComment(
            account.access_token,
            linkedinPostUrn,
            account.provider_user_id,
            first_comment
          )
        } catch (commentErr) {
          console.error('Failed to add first comment:', commentErr)
          // We don't fail the whole request if only the comment fails
        }
      }
      publishData = { published_at: new Date().toISOString() }
    }

    // 2. Save/Update post in Supabase
    const postData = {
      user_id: user.id,
      content,
      first_comment,
      status,
      scheduled_at: status === 'scheduled' ? scheduled_at : null,
      ...publishData
    }

    let result
    if (postId) {
      result = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Post API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
