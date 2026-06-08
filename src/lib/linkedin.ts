export type LinkedInAccount = {
  id: string
  access_token: string
  provider_account_id: string
  expires_at: string | null
}

// Returns a valid access token, refreshing if expired.
// LinkedIn Basic OAuth does NOT support refresh tokens — when expired,
// user must reconnect. This function detects expiry and throws a clear error.
export function assertTokenValid(account: LinkedInAccount) {
  if (!account.expires_at) return

  const expiresAt = new Date(account.expires_at)
  const now = new Date()
  const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursLeft <= 0) {
    throw new Error('LinkedIn token expired. Please reconnect your account in Settings.')
  }

  // Warn if expiring within 7 days (logged server-side only)
  if (hoursLeft < 24 * 7) {
    console.warn(`LinkedIn token expiring in ${Math.round(hoursLeft)}h for account ${account.id}`)
  }
}
