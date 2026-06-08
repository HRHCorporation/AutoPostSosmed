// Supabase browser client — commented out, using local PostgreSQL (lib/db) instead
// import { createBrowserClient } from '@supabase/ssr'
// export function createClient() {
//   return createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )
// }

export function createClient() {
  throw new Error('Browser Supabase client is disabled. Use server-side lib/db instead.')
}
