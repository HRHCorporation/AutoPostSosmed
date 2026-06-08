import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'
import { assertTokenValid } from '@/lib/linkedin'
import { publishToThreads, assertThreadsTokenValid } from '@/lib/threads'
import { publishToInstagram, assertInstagramTokenValid } from '@/lib/instagram'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const { data: duePosts, error } = await supabase
      .from('posts')
      .select('id, user_id, content, visibility, platforms, image_url')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())

    if (error) throw new Error(error.message)
    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: 'No posts scheduled to publish' })
    }

    const results = { published: 0, failed: 0, errors: [] as string[] }

    for (const post of duePosts) {
      const platforms: string[] = post.platforms
        ? post.platforms.split(',')
        : ['linkedin']

      const contentText = post.content?.replace(/<[^>]+>/g, '') ?? ''
      let postSuccess = false

      // ── LinkedIn ────────────────────────────────────────────
      if (platforms.includes('linkedin')) {
        const { data: account } = await supabase
          .from('social_accounts')
          .select('id, access_token, provider_account_id, expires_at')
          .eq('user_id', post.user_id)
          .eq('provider', 'linkedin')
          .single()

        if (!account?.access_token || !account?.provider_account_id) {
          results.errors.push(`Post ${post.id} LinkedIn: account not connected`)
        } else {
          try {
            assertTokenValid(account)
            const urn = `urn:li:person:${account.provider_account_id}`
            const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
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
                visibility: {
                  'com.linkedin.ugc.MemberNetworkVisibility': post.visibility ?? 'PUBLIC',
                },
              }),
            })
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.message ?? `HTTP ${res.status}`)
            }
            postSuccess = true
          } catch (e: any) {
            results.errors.push(`Post ${post.id} LinkedIn: ${e.message}`)
          }
        }
      }

      // ── Threads ─────────────────────────────────────────────
      if (platforms.includes('threads')) {
        const { data: account } = await supabase
          .from('social_accounts')
          .select('id, access_token, provider_account_id, expires_at')
          .eq('user_id', post.user_id)
          .eq('provider', 'threads')
          .single()

        if (!account?.access_token || !account?.provider_account_id) {
          results.errors.push(`Post ${post.id} Threads: account not connected`)
        } else {
          try {
            assertThreadsTokenValid(account)
            await publishToThreads(account.access_token, account.provider_account_id, contentText)
            postSuccess = true
          } catch (e: any) {
            results.errors.push(`Post ${post.id} Threads: ${e.message}`)
          }
        }
      }

      // ── Instagram ────────────────────────────────────────────
      if (platforms.includes('instagram')) {
        if (!post.image_url) {
          results.errors.push(`Post ${post.id} Instagram: no image_url set`)
        } else {
          const { data: account } = await supabase
            .from('social_accounts')
            .select('id, access_token, provider_account_id, expires_at')
            .eq('user_id', post.user_id)
            .eq('provider', 'instagram')
            .single()

          if (!account?.access_token || !account?.provider_account_id) {
            results.errors.push(`Post ${post.id} Instagram: account not connected`)
          } else {
            try {
              assertInstagramTokenValid(account)
              await publishToInstagram(account.access_token, account.provider_account_id, contentText, post.image_url)
              postSuccess = true
            } catch (e: any) {
              results.errors.push(`Post ${post.id} Instagram: ${e.message}`)
            }
          }
        }
      }

      if (postSuccess) {
        await supabase
          .from('posts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', post.id)
        results.published++
      } else {
        results.failed++
      }
    }

    return NextResponse.json({
      message: `Published ${results.published}, failed ${results.failed}`,
      ...results,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
