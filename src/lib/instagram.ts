export type InstagramAccount = {
  id: string
  access_token: string
  provider_account_id: string
  expires_at: string | null
}

// Two-step publish: create media container → publish
export async function publishToInstagram(
  pageAccessToken: string,
  igUserId: string,
  caption: string,
  imageUrl: string
): Promise<void> {
  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl, caption }),
    }
  )

  if (!containerRes.ok) {
    const err = await containerRes.json()
    throw new Error(err.error?.message ?? `Instagram container error: HTTP ${containerRes.status}`)
  }

  const { id: containerId } = await containerRes.json()

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creation_id: containerId }),
    }
  )

  if (!publishRes.ok) {
    const err = await publishRes.json()
    throw new Error(err.error?.message ?? `Instagram publish error: HTTP ${publishRes.status}`)
  }
}

export function assertInstagramTokenValid(account: InstagramAccount) {
  if (!account.expires_at) return

  const expiresAt = new Date(account.expires_at)
  const hoursLeft = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursLeft <= 0) {
    throw new Error('Instagram token expired. Please reconnect your account in Settings.')
  }

  if (hoursLeft < 24 * 7) {
    console.warn(`Instagram token expiring in ${Math.round(hoursLeft)}h for account ${account.id}`)
  }
}
