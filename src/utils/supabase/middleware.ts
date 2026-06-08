import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  return NextResponse.next({ request })
}
