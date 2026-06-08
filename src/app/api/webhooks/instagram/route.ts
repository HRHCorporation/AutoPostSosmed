import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

// GET — Meta webhook verification
export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST — Meta sends comment events here
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Process each entry
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'comments') continue

        const commentData = change.value
        const commentText: string = (commentData.text ?? '').toLowerCase().trim()
        const commenterId: string = commentData.from?.id

        if (!commentText || !commenterId) continue

        await handleComment({ commentText, commenterId })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleComment({
  commentText,
  commenterId,
}: {
  commentText: string
  commenterId: string
}) {
  const db = createClient()

  // Get all active automations for instagram
  const { data: automations } = await db
    .from('automations')
    .select('id, user_id, trigger_keyword, dm_message')
    .eq('platform', 'instagram')
    .eq('is_active', true)

  if (!automations || automations.length === 0) return

  for (const automation of automations as any[]) {
    const keyword = automation.trigger_keyword.toLowerCase().trim()

    // Check if comment contains the keyword
    if (!commentText.includes(keyword)) continue

    // Get Instagram account for this user
    const { data: account } = await db
      .from('social_accounts')
      .select('access_token, provider_account_id')
      .eq('user_id', automation.user_id)
      .eq('provider', 'instagram')
      .single()

    if (!(account as any)?.access_token) continue

    // Send DM to commenter
    await sendInstagramDM(
      (account as any).access_token,
      (account as any).provider_account_id,
      commenterId,
      automation.dm_message
    )

    console.log(`Auto DM sent to ${commenterId} for keyword "${keyword}"`)
  }
}

async function sendInstagramDM(
  pageAccessToken: string,
  igAccountId: string,
  recipientId: string,
  message: string
) {
  // Instagram DM endpoint uses the IG Business Account ID, not "me"
  const res = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pageAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: 'RESPONSE',
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Instagram DM failed: ${err.error?.message ?? res.status}`)
  }
}
