import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loadModules(server) {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const { default: Header } = await server.ssrLoadModule('/src/components/Header.jsx')
  const { default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx')
  const { default: Hero } = await server.ssrLoadModule('/src/components/Hero.jsx')
  const { default: UrlInput, isValidMediaUrl, getPlatformName } = await server.ssrLoadModule('/src/components/UrlInput.jsx')
  const { default: ResultCard } = await server.ssrLoadModule('/src/components/ResultCard.jsx')
  const { analyzeMedia } = await server.ssrLoadModule('/src/api/analyzeMedia.js')
  const { startDownloadJob, pollJobStatus, cancelDownloadJob, getFileDownloadUrl } = await server.ssrLoadModule('/src/api/downloadMedia.js')
  return { App, Header, Footer, Hero, UrlInput, isValidMediaUrl, getPlatformName, ResultCard, analyzeMedia, startDownloadJob, pollJobStatus, cancelDownloadJob, getFileDownloadUrl }
}

// ── URL validation & Platform detection ───────────────────────────────────────

test('isValidMediaUrl accepts http/https URLs and rejects others', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { isValidMediaUrl } = await loadModules(server)
    assert.equal(isValidMediaUrl('https://example.com/video'), true)
    assert.equal(isValidMediaUrl('http://example.com/photo.jpg'), true)
    for (const invalid of ['', 'not a link', 'ftp://example.com/file', 'https://']) {
      assert.equal(isValidMediaUrl(invalid), false, `expected false for: ${invalid}`)
    }
  } finally {
    await server.close()
  }
})

test('getPlatformName derives platform accurately from URL', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { getPlatformName } = await loadModules(server)
    assert.equal(getPlatformName('https://www.tiktok.com/@user/video/123', 'video'), 'TikTok')
    assert.equal(getPlatformName('https://youtu.be/abc', 'video'), 'YouTube')
    assert.equal(getPlatformName('https://www.youtube.com/watch?v=abc', 'video'), 'YouTube')
    assert.equal(getPlatformName('https://www.instagram.com/reel/abc', 'video'), 'Instagram')
    assert.equal(getPlatformName('https://x.com/user/status/123', 'video'), 'X')
    assert.equal(getPlatformName('https://example.com/direct.mp4', 'video'), 'VIDEO')
  } finally {
    await server.close()
  }
})

// ── ResultCard with real server metadata ──────────────────────────────────────

test('ResultCard renders server-provided title, duration (mm:ss), and media_type', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)

    const videoMedia = { title: 'My Video', duration: 204, media_type: 'video', thumbnail: null, available_formats: ['video', 'audio'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media: videoMedia }))
    assert.match(html, /DETECTED/)
    assert.match(html, /My Video/)
    assert.match(html, /VIDEO • 03:24/)
    assert.match(html, /VIDEO QUALITY/)
    assert.match(html, /Best/)
    assert.match(html, /DOWNLOAD VIDEO/)

    // Long title wrapping
    const longMedia = { title: 'Example Media With A VeryLongUnbrokenSectionForTesting', duration: 65, media_type: 'video', thumbnail: null, available_formats: ['video', 'audio'] }
    const longHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media: longMedia }))
    assert.match(longHtml, /VeryLongUnbrokenSectionForTesting/)
    assert.match(longHtml, /VIDEO • 01:05/)
  } finally {
    await server.close()
  }
})

test('ResultCard shows --:-- when duration is null', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const imageMedia = { title: 'photo.jpg', duration: null, media_type: 'image', thumbnail: 'https://example.com/photo.jpg', available_formats: ['image'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media: imageMedia }))
    assert.match(html, /--:--/)
    assert.match(html, /IMAGE/)
  } finally {
    await server.close()
  }
})

test('ResultCard shows thumbnail img when thumbnail is provided', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'photo.jpg', duration: null, media_type: 'image', thumbnail: 'https://example.com/photo.jpg', available_formats: ['image'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media }))
    assert.match(html, /src="https:\/\/example\.com\/photo\.jpg"/)
  } finally {
    await server.close()
  }
})

test('ResultCard shows THUMBNAIL format button when thumbnail is in available_formats', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const platformMedia = { title: 'Platform Video', duration: 300, media_type: 'video', thumbnail: 'https://img.com/t.jpg', available_formats: ['video', 'audio', 'thumbnail'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'THUMBNAIL', quality: 'Original', media: platformMedia }))
    assert.match(html, /THUMBNAIL/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders downloading and file ready states with real file info', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'clip.mp4', duration: 120, media_type: 'video', thumbnail: null, available_formats: ['video', 'audio'] }

    // Downloading state with progress
    const downloadingJob = { status: 'downloading', progress: 45.5, downloaded_bytes: 45000000 }
    const downloadingHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'downloading', format: 'VIDEO', quality: '1080p', media, job: downloadingJob, onClear() {} }))
    assert.match(downloadingHtml, /DOWNLOADING/)
    assert.match(downloadingHtml, /45\.5%/)

    // Ready state with file link and size
    const readyJob = { status: 'ready', file_id: 'abc123xyz', filename: 'clip.mp4', file_size: 13000000 }
    const readyHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'success', format: 'VIDEO', quality: '1080p', media, job: readyJob, onClear() {} }))
    assert.match(readyHtml, /FILE READY/)
    assert.match(readyHtml, /clip\.mp4/)
    assert.match(readyHtml, /12\.4 MB/)
    assert.match(readyHtml, /Expires in 30 minutes/)
    assert.match(readyHtml, /href="\/api\/files\/abc123xyz"/)
    assert.match(readyHtml, /DOWNLOAD FILE/i)
    assert.match(readyHtml, /New Link/)
  } finally {
    await server.close()
  }
})

// ── analyzeMedia API module ───────────────────────────────────────────────────

test('analyzeMedia sends POST to /api/analyze and returns server data', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const originalFetch = globalThis.fetch
  try {
    const { analyzeMedia } = await loadModules(server)
    const controller = new AbortController()
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/analyze')
      assert.equal(options.method, 'POST')
      assert.deepEqual(JSON.parse(options.body), { url: 'https://example.com/video.mp4' })
      assert.equal(options.signal, controller.signal)
      return {
        ok: true,
        json: async () => ({
          title: 'video.mp4',
          duration: null,
          media_type: 'video',
          thumbnail: null,
          source: 'direct',
          available_formats: ['video', 'audio'],
        }),
      }
    }
    const result = await analyzeMedia('https://example.com/video.mp4', controller.signal)
    assert.equal(result.title, 'video.mp4')
    assert.equal(result.duration, null)
    assert.equal(result.media_type, 'video')
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

// ── downloadMedia API module ──────────────────────────────────────────────────

test('downloadMedia module starts, polls, and cancels jobs correctly', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const originalFetch = globalThis.fetch
  try {
    const { startDownloadJob, pollJobStatus, cancelDownloadJob, getFileDownloadUrl } = await loadModules(server)

    // 1. Start download
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/download')
      assert.equal(options.method, 'POST')
      return {
        ok: true,
        json: async () => ({ job_id: 'job123', status: 'queued' }),
      }
    }
    const startRes = await startDownloadJob('https://example.com/vid.mp4', 'video', 'Best')
    assert.equal(startRes.job_id, 'job123')
    assert.equal(startRes.status, 'queued')

    // 2. Poll job status
    globalThis.fetch = async (path) => {
      assert.equal(path, '/api/jobs/job123')
      return {
        ok: true,
        json: async () => ({ job_id: 'job123', status: 'ready', file_id: 'file456' }),
      }
    }
    const pollRes = await pollJobStatus('job123')
    assert.equal(pollRes.status, 'ready')
    assert.equal(pollRes.file_id, 'file456')

    // 3. Cancel job
    let cancelCalled = false
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/jobs/job123/cancel')
      assert.equal(options.method, 'POST')
      cancelCalled = true
      return { ok: true, json: async () => ({ status: 'cancelled' }) }
    }
    await cancelDownloadJob('job123')
    assert.equal(cancelCalled, true)

    // 4. File download url
    assert.equal(getFileDownloadUrl('file456'), '/api/files/file456')
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

// ── Phase 8.6: CRT Scanline Overlay Retirement ───────────────────────────────

test('App does not render scanline-overlay', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { App } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(App))
    assert.doesNotMatch(html, /scanline-overlay/)
  } finally {
    await server.close()
  }
})

// ── Phase 8.6: Hero & UrlInput Action Polish ─────────────────────────────────

test('Hero renders playful decorations and subtitle', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { Hero } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(Hero))
    assert.match(html, /Fast • Simple • Colorful/)
    assert.match(html, /✦/)
  } finally {
    await server.close()
  }
})

test('UrlInput renders analyze button with decorative stars and analyze-btn class', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { UrlInput } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(UrlInput))
    assert.match(html, /analyze-btn/)
    assert.match(html, /ANALYZE/)
    assert.match(html, /✦/)
  } finally {
    await server.close()
  }
})

// ── Phase 8.6: Layered Result Card & Dynamic Format Theming ──────────────────

test('ResultCard renders with pixel-border-layered and dynamic data-format-theme', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'Test Video', duration: 120, media_type: 'video', available_formats: ['video', 'audio', 'image'] }

    // Video format theme
    const videoHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media }))
    assert.match(videoHtml, /pixel-border-layered/)
    assert.match(videoHtml, /data-format-theme="video"/)
    assert.match(videoHtml, /download-cta--video/)
    assert.match(videoHtml, /DOWNLOAD VIDEO/)

    // Audio format theme
    const audioHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'MP3', quality: 'Best', media }))
    assert.match(audioHtml, /data-format-theme="audio"/)
    assert.match(audioHtml, /download-cta--audio/)
    assert.match(audioHtml, /DOWNLOAD MP3/)

    // Image format theme
    const imageHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media }))
    assert.match(imageHtml, /data-format-theme="image"/)
    assert.match(imageHtml, /download-cta--image/)
    assert.match(imageHtml, /DOWNLOAD IMAGE/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders Best quality choice with star badge styling', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'Test Video', duration: 120, media_type: 'video', available_formats: ['video'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media }))
    assert.match(html, /★/)
    assert.match(html, /Best quality \(Recommended\)/)
    assert.match(html, /result-option--best/)
  } finally {
    await server.close()
  }
})

// ── Phase 8.6: Mint Green File Ready Completion ──────────────────────────────

test('ResultCard file ready state renders mint-themed download-file-btn', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'My Video', duration: 120, media_type: 'video', available_formats: ['video'] }
    const job = { file_id: 'file123', filename: 'my_video.mp4', file_size: 52428800 }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'success', format: 'VIDEO', quality: 'Best', media, job }))
    assert.match(html, /download-file-btn/)
    assert.match(html, /DOWNLOAD FILE/)
    assert.match(html, /\/api\/files\/file123/)
    assert.match(html, /50\.0 MB/)
    assert.match(html, /Expires in 30 minutes/)
  } finally {
    await server.close()
  }
})

// ── Phase 8.6: Header & Footer Colorful Retro Alignment ──────────────────────

test('Header and Footer render cohesive colorful retro branding', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { Header, Footer } = await loadModules(server)

    const headerHtml = renderToStaticMarkup(createElement(Header, { theme: 'dark', onToggle: () => {} }))
    assert.match(headerHtml, /MediaDrop/)
    assert.match(headerHtml, /theme-toggle/)

    const footerHtml = renderToStaticMarkup(createElement(Footer))
    assert.match(footerHtml, /FAST &amp; COLORFUL/i)
    assert.match(footerHtml, /✦/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders ambient card decorations and retains format theme during progress', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'Audio Track', duration: 180, media_type: 'audio', available_formats: ['audio'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'downloading', format: 'MP3', quality: '320 kbps', media, job: { progress: 45 } }))
    assert.match(html, /card-decorations/)
    assert.match(html, /data-format-theme="audio"/)
    assert.match(html, /activity-bar/)
    assert.match(html, /45%/)
  } finally {
    await server.close()
  }
})






