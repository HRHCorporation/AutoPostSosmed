// Supabase auth signout — commented out, no-auth mode has no session to clear
// import { createClient } from '@/utils/supabase/server'

import { redirect } from 'next/navigation'

export async function POST() {
  return redirect('/dashboard')
}
