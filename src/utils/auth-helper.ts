// Authentication helper - Single user mode
// No authentication required, returns hardcoded user ID

import { SINGLE_USER_ID } from '@/config/auth'

export function getSingleUserId() {
  return SINGLE_USER_ID
}

export function isAuthDisabled() {
  return true
}
