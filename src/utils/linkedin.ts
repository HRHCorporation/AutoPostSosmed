export async function publishLinkedInPost(accessToken: string, authorUrn: string, content: string) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`LinkedIn API error: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.id // This is the ugcPost URN or ID
}

export async function addLinkedInComment(accessToken: string, postUrn: string, actorUrn: string, comment: string) {
  // postUrn should be like urn:li:ugcPost:12345
  const response = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actor: actorUrn,
      object: postUrn,
      message: {
        text: comment,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`LinkedIn Comment API error: ${JSON.stringify(errorData)}`)
  }

  return await response.json()
}
