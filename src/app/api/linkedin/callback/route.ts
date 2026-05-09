import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SINGLE_USER_ID } from '@/config/auth'

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

    // Using hardcoded user ID - no authentication required
    const userId = SINGLE_USER_ID

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
      const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      const userInfo = await userInfoResponse.json();
      const accountName = userInfo.name || null;
      const accountPicture = userInfo.picture || null;
      const accountSub = userInfo.sub || null; // This is the URN ID needed to publish!

      // Save token in DB
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString()
      
      const { data: existing } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', 'linkedin')
        .single();

      let dbError = null;
      if (existing) {
        const { error } = await supabase.from('social_accounts').update({
          access_token: data.access_token,
          expires_at: expiresAt,
          account_name: accountName,
          account_picture: accountPicture,
          provider_account_id: accountSub
        }).eq('id', existing.id);
        dbError = error;
      } else {
        const { error } = await supabase.from('social_accounts').insert({
          user_id: userId,
          provider: 'linkedin',
          access_token: data.access_token,
          expires_at: expiresAt,
          account_name: accountName,
          account_picture: accountPicture,
          provider_account_id: accountSub
        });
        dbError = error;
      }

      if (dbError) {
        console.error("Database save failed:", dbError);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=db_error`)
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`)
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=token_failed`)
    }
  } catch (err) {
    console.error(err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=server_error`)
  }
}
