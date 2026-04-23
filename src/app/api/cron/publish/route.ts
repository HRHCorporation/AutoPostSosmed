import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishLinkedInPost, addLinkedInComment } from '@/utils/linkedin'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if(!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch scheduled posts that are due
    const { data: duePosts, error } = await supabase
      .from('posts')
      .select('id, user_id, content, first_comment')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())

    if (error) throw error

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: 'No posts scheduled to publish' })
    }

    for (const post of duePosts) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('access_token, provider_user_id')
        .eq('user_id', post.user_id)
        .eq('provider', 'linkedin')
        .single()

      if (!account?.access_token || !account?.provider_user_id) {
        console.error(`No complete LinkedIn account found for user ${post.user_id}`)
        continue
      }

      try {
        const postUrn = await publishLinkedInPost(
          account.access_token,
          account.provider_user_id,
          post.content
        )

        // Post first comment if exists
        if (post.first_comment) {
          try {
            await addLinkedInComment(
              account.access_token,
              postUrn,
              account.provider_user_id,
              post.first_comment
            )
          } catch (commentErr) {
            console.error(`Failed to add first comment for post ${post.id}:`, commentErr)
          }
        }

        // Mark as published
        await supabase
          .from('posts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', post.id)

        console.log(`Successfully published post ${post.id}`)
      } catch (err) {
        console.error(`Failed to publish post ${post.id}`, err)
      }
    }

    return NextResponse.json({ message: `Successfully processed ${duePosts.length} posts` })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
