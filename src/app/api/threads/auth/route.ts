import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.THREADS_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/threads/callback`

  const authUrl = new URL('https://threads.net/oauth/authorize')
  authUrl.searchParams.append('client_id', appId || '')
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('scope', 'threads_basic,threads_content_publish')
  authUrl.searchParams.append('response_type', 'code')

  return NextResponse.redirect(authUrl.toString())
}
