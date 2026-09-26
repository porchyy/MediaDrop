export async function startDownloadJob(url, format, quality, options = {}) {
  const { output_format, image_index, download_all } = options
  const payload = { url, format, quality }
  if (output_format !== undefined) payload.output_format = output_format
  if (image_index !== undefined) payload.image_index = image_index
  if (download_all !== undefined) payload.download_all = download_all

  const response = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
