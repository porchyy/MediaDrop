export async function startDownloadJob(url, format, quality) {
  const response = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format, quality }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw Object.assign(new Error(data.message || 'Download start failed'), { code: data.code })
  }
  return data // { job_id, status }
}

export async function pollJobStatus(jobId) {
  const response = await fetch(`/api/jobs/${jobId}`)
  const data = await response.json()
  if (!response.ok) {
    throw Object.assign(new Error(data.detail || 'Failed to get job status'), { status: response.status })
  }
  return data
}

export async function cancelDownloadJob(jobId) {
  try {
    await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' })
  } catch (_) {
    // Ignore network errors on cancellation
  }
}

export function getFileDownloadUrl(fileId) {
  return `/api/files/${fileId}`
}
