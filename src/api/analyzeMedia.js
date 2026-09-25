export async function analyzeMedia(url, signal) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal,
  })
  const data = await response.json()

  if (!response.ok) {
    throw Object.assign(new Error(data.message || 'Analyze failed'), { code: data.code })
  }
  if (
    typeof data.title !== 'string' ||
    typeof data.media_type !== 'string' ||
    (data.duration !== null && (!Number.isInteger(data.duration) || data.duration < 0))
  ) {
    throw new Error('Invalid Analyze response')
  }
  return data
}
