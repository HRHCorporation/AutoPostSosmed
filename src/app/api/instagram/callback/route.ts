import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'
import { SINGLE_USER_ID } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const errorParam = url.searchParams.get('error')
  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`

  if (errorParam || !code) {
    return NextResponse.redirect(`${settingsUrl}?error=${errorParam ?? 'no_code'}`)
  }

  try {
    const db = createClient()
    const userId = SINGLE_USER_ID

    const appId = process.env.INSTAGRAM_APP_ID!
    const appSecret = process.env.INSTAGRAM_APP_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`

    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('Instagram token failed:', tokenData)
      return NextResponse.redirect(`${settingsUrl}?error=token_failed`)
    }

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longLivedData = await longLivedRes.json()
    const accessToken = longLivedData.access_token ?? tokenData.access_token
    const expiresIn = longLivedData.expires_in ?? 3600
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Step 3: Get Facebook Pages
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesRes.json()
    const page = pagesData.data?.[0]
    if (!page) {
      return NextResponse.redirect(`${settingsUrl}?error=no_facebook_page`)
    }

    // Step 4: Get Instagram Business Account from the Page
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    const igData = await igRes.json()
    const igAccountId = igData.instagram_business_account?.id
    if (!igAccountId) {
      return NextResponse.redirect(`${settingsUrl}?error=no_instagram_account`)
    }

    // Step 5: Get Instagram profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,name,username,profile_picture_url&access_token=${page.access_token}`
    )
    const profile = await profileRes.json()

    // Step 6: Upsert social_accounts
    const { data: existing } = await db
      .from('social_accounts').select('id')
      .eq('user_id', userId).eq('provider', 'instagram').single()

    const payload = {
      access_token: page.access_token,
      expires_at: expiresAt,
      account_name: profile.username ?? profile.name ?? null,
      account_picture: profile.profile_picture_url ?? null,
      provider_account_id: igAccountId,
    }

    if (existing) {
      await db.from('social_accounts').update(payload).eq('id', (existing as any).id)
    } else {
      await db.from('social_accounts').insert({ user_id: userId, provider: 'instagram', ...payload })
    }

    return NextResponse.redirect(`${settingsUrl}?success=true`)
  } catch (err) {
    console.error('Instagram callback error:', err)
    return NextResponse.redirect(`${settingsUrl}?error=server_error`)
  }
}
