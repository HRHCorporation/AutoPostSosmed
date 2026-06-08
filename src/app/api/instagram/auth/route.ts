import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  authUrl.searchParams.append('client_id', appId || '')
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('scope', [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_messages',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
  ].join(','))
  authUrl.searchParams.append('response_type', 'code')

  return NextResponse.redirect(authUrl.toString())
}
