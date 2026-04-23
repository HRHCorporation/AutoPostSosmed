import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${errorParam}`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`)
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID!
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const data = await response.json()

    if (data.access_token) {
      // Fetch LinkedIn profile to get the URN (sub or id)
      const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      })
      const profileData = await profileResponse.json()
      const linkedinUrn = `urn:li:person:${profileData.id}`

      // Save token in DB
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString()
      
      await supabase.from('social_accounts').upsert({
        user_id: user.id,
        provider: 'linkedin',
        provider_user_id: linkedinUrn,
        access_token: data.access_token,
        expires_at: expiresAt
      })

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`)
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=token_failed`)
    }
  } catch (err) {
    console.error(err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=server_error`)
  }
}
