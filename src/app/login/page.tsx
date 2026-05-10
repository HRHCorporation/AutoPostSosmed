import { redirect } from 'next/navigation'

export default function LoginPage() {
  // Authentication disabled - redirect directly to dashboard
  redirect('/dashboard')
}
