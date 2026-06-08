import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const errorParam = url.searchParams.get('error')

  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`

  if (errorParam || !code) {
    return NextResponse.redirect(`${settingsUrl}?error=${errorParam ?? 'no_code'}`)
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=not_authenticated`)
    }

    const appId = process.env.THREADS_APP_ID!
    const appSecret = process.env.THREADS_APP_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/threads/callback`

    // Step 1: Exchange code for short-lived token (1 hour)
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('Threads token exchange failed:', tokenData)
      return NextResponse.redirect(`${settingsUrl}?error=token_failed`)
    }

    // Step 2: Exchange short-lived for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`
    )
    const longLivedData = await longLivedRes.json()

    const accessToken = longLivedData.access_token ?? tokenData.access_token
    const expiresIn = longLivedData.expires_in ?? tokenData.expires_in ?? 3600
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Step 3: Get user profile
    const userInfoRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    )
    const userInfo = await userInfoRes.json()

    // Step 4: Upsert into social_accounts
    const { data: existing } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'threads')
      .single()

    const payload = {
      access_token: accessToken,
      expires_at: expiresAt,
      account_name: userInfo.username ?? null,
      account_picture: userInfo.threads_profile_picture_url ?? null,
      provider_account_id: String(userInfo.id),
    }

    if (existing) {
      await supabase.from('social_accounts').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('social_accounts').insert({
        user_id: user.id,
        provider: 'threads',
        ...payload,
      })
    }

    return NextResponse.redirect(`${settingsUrl}?success=true`)
  } catch (err) {
    console.error('Threads callback error:', err)
    return NextResponse.redirect(`${settingsUrl}?error=server_error`)
  }
}
