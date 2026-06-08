// Authentication helper — Single user mode, no auth required
import { SINGLE_USER_ID } from '@/lib/db'

export function getSingleUserId() {
  return SINGLE_USER_ID
}

export function isAuthDisabled() {
  return true
}
