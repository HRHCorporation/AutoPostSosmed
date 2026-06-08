export type ThreadsAccount = {
  id: string
  access_token: string
  provider_account_id: string
  expires_at: string | null
}

// Two-step publish: create container → publish
export async function publishToThreads(
  accessToken: string,
  threadsUserId: string,
  text: string
): Promise<void> {
  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media_type: 'TEXT', text }),
    }
  )

  if (!containerRes.ok) {
    const err = await containerRes.json()
    throw new Error(err.error?.message ?? `Threads container error: HTTP ${containerRes.status}`)
  }

  const { id: containerId } = await containerRes.json()

  // Meta recommends a brief pause before publishing
  await new Promise(r => setTimeout(r, 1000))

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creation_id: containerId }),
    }
  )

  if (!publishRes.ok) {
    const err = await publishRes.json()
    throw new Error(err.error?.message ?? `Threads publish error: HTTP ${publishRes.status}`)
  }
}

// Refresh Threads long-lived token (valid 60 days, refresh before expiry)
export async function refreshThreadsToken(
  accessToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(
    `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(accessToken)}`
  )

  if (!res.ok) {
    throw new Error('Threads token refresh failed')
  }

  return res.json()
}

export function assertThreadsTokenValid(account: ThreadsAccount) {
  if (!account.expires_at) return

  const expiresAt = new Date(account.expires_at)
  const hoursLeft = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursLeft <= 0) {
    throw new Error('Threads token expired. Please reconnect your account in Settings.')
  }

  if (hoursLeft < 24 * 7) {
    console.warn(`Threads token expiring in ${Math.round(hoursLeft)}h for account ${account.id}`)
  }
}
