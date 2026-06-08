'use server'

// Supabase auth — commented out, using no-auth (SINGLE_USER) mode
// import { createClient } from '@/utils/supabase/server'

import { redirect } from 'next/navigation'

export async function login() {
  redirect('/dashboard')
}

export async function signup() {
  redirect('/dashboard')
}
