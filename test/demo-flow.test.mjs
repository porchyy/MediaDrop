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
  const { default: SupportedFormats } = await server.ssrLoadModule('/src/components/SupportedFormats.jsx')
  const { default: ResultCard } = await server.ssrLoadModule('/src/components/ResultCard.jsx')
  const { analyzeMedia } = await server.ssrLoadModule('/src/api/analyzeMedia.js')
  const { startDownloadJob, pollJobStatus, cancelDownloadJob, getFileDownloadUrl } = await server.ssrLoadModule('/src/api/downloadMedia.js')
  return { App, Header, Footer, Hero, UrlInput, SupportedFormats, isValidMediaUrl, getPlatformName, ResultCard, analyzeMedia, startDownloadJob, pollJobStatus, cancelDownloadJob, getFileDownloadUrl }
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

    // 1b. Start download with options (output_format, image_index, download_all)
    let dispatchedPayload = null
    globalThis.fetch = async (path, options) => {
      dispatchedPayload = JSON.parse(options.body)
      return { ok: true, json: async () => ({ job_id: 'job456', status: 'queued' }) }
    }
    await startDownloadJob('https://example.com/thumb', 'thumbnail', 'Original', {
      output_format: 'jpg',
      image_index: 2,
      download_all: true,
    })
    assert.equal(dispatchedPayload.output_format, 'jpg')
    assert.equal(dispatchedPayload.image_index, 2)
    assert.equal(dispatchedPayload.download_all, true)

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
    assert.match(html, /PASTE • PICK • DOWNLOAD/)
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

test('ResultCard renders THUMBNAIL format options with Original ★, JPG, and PNG choices', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = {
      title: 'Video with Cover',
      duration: 120,
      media_type: 'video',
      thumbnail: 'https://example.com/cover.webp',
      available_formats: ['video', 'audio', 'thumbnail'],
    }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'THUMBNAIL', quality: 'Original', media }))
    assert.match(html, /THUMBNAIL FORMAT/)
    assert.match(html, /Original/)
    assert.match(html, /★/)
    assert.match(html, /JPG/)
    assert.match(html, /PNG/)
    assert.doesNotMatch(html, /720p/)
    assert.doesNotMatch(html, /1080p/)
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

// ── Phase 8.7: Visual Depth & Product Polish ─────────────────────────────────

test('App renders bg-depth-layer for visual depth and atmospheric lighting', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { App } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(App))
    assert.match(html, /bg-depth-layer/)
  } finally {
    await server.close()
  }
})

test('Header renders status-badge with ONLINE indicator', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { Header } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(Header, { theme: 'dark', onToggle: () => {} }))
    assert.match(html, /status-badge/)
    assert.match(html, /ONLINE/)
  } finally {
    await server.close()
  }
})

test('UrlInput renders paste-btn--cyan and tactile input icons', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { UrlInput } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(UrlInput))
    assert.match(html, /paste-btn--cyan/)
    assert.match(html, /url-input-icon/)
  } finally {
    await server.close()
  }
})

test('SupportedFormats renders format identity classes and step guide strip', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { SupportedFormats } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(SupportedFormats))
    assert.match(html, /format-card--audio/)
    assert.match(html, /format-card--video/)
    assert.match(html, /format-card--image/)
    assert.match(html, /step-guide-strip/)
    assert.match(html, /01 PASTE/)
    assert.match(html, /02 PICK/)
    assert.match(html, /03 DOWNLOAD/)
  } finally {
    await server.close()
  }
})

test('Footer renders site-footer and low-contrast footer-copyright', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { Footer } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(Footer))
    assert.match(html, /site-footer/)
    assert.match(html, /footer-copyright/)
  } finally {
    await server.close()
  }
})

test('UrlInput maintains layout stability and renders without layout-shifting inline padding', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { UrlInput } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(UrlInput))
    // Ensures input padding does not jump between 1.25rem and 2.5rem
    assert.doesNotMatch(html, /padding-left:\s*1\.25rem/)
    assert.match(html, /pixel-input/)
    assert.match(html, /paste-btn--cyan/)
  } finally {
    await server.close()
  }
})

test('SupportedFormats renders semantic nav and ol structure for step guide strip', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { SupportedFormats } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(SupportedFormats, { isIdle: true }))
    assert.match(html, /<nav class="step-guide-strip"/)
    assert.match(html, /<ol class="step-guide-list"/)
    assert.match(html, /01 PASTE/)
    assert.match(html, /02 PICK/)
    assert.match(html, /03 DOWNLOAD/)

    // Hidden in non-idle mode
    const nonIdleHtml = renderToStaticMarkup(createElement(SupportedFormats, { isIdle: false }))
    assert.doesNotMatch(nonIdleHtml, /step-guide-strip/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders format-specific themes and halos for MP3, Video, and Image', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'Test Title', duration: 100, available_formats: ['video', 'audio', 'image'] }

    // MP3 -> audio theme
    const mp3Html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'MP3', quality: 'Best', media }))
    assert.match(mp3Html, /data-format-theme="audio"/)
    assert.match(mp3Html, /download-cta--audio/)

    // Video -> video theme
    const videoHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media }))
    assert.match(videoHtml, /data-format-theme="video"/)
    assert.match(videoHtml, /download-cta--video/)

    // Image -> image theme
    const imageHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media }))
    assert.match(imageHtml, /data-format-theme="image"/)
    assert.match(imageHtml, /download-cta--image/)
  } finally {
    await server.close()
  }
})

// ── Phase 8.8.1: TikTok Photo Posts & Carousel ───────────────────────────────

test('ResultCard renders multi-image gallery with carousel dock, counter, and action buttons', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = {
      title: 'TikTok Photo Post with 5 Photos',
      media_type: 'gallery',
      image_count: 5,
      images: [
        { index: 0, url: 'https://example.com/1.jpg' },
        { index: 1, url: 'https://example.com/2.jpg' },
        { index: 2, url: 'https://example.com/3.jpg' },
        { index: 3, url: 'https://example.com/4.jpg' },
        { index: 4, url: 'https://example.com/5.jpg' },
      ],
      available_formats: ['image'],
    }

    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media }))
    assert.match(html, /5 IMAGES/)
    assert.match(html, /gallery-hero/)
    assert.match(html, /carousel-dock/)
    assert.match(html, /carousel-nav-btn/)
    assert.match(html, /1 \/ 5/)
    assert.match(html, /CURRENT IMAGE/)
    assert.match(html, /ALL IMAGES \(\.ZIP\)/)
    assert.match(html, /download-cta--zip/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders single-image gallery without carousel controls or ZIP button', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = {
      title: 'TikTok Single Photo Post',
      media_type: 'gallery',
      image_count: 1,
      images: [{ index: 0, url: 'https://example.com/solo.jpg' }],
      available_formats: ['image'],
    }

    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media }))
    assert.match(html, /1 IMAGE/)
    assert.doesNotMatch(html, /carousel-dock/)
    assert.doesNotMatch(html, /ALL IMAGES \(\.ZIP\)/)
    assert.match(html, /DOWNLOAD IMAGE/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders Instagram single photo with INSTAGRAM • PHOTO and DOWNLOAD IMAGE', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = {
      title: 'Instagram Photo',
      platform: 'instagram',
      media_type: 'image',
      image_count: 1,
      items: [{ index: 0, type: 'image', url: 'https://example.com/ig-photo.jpg' }],
      available_formats: ['image'],
    }

    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media, platform: 'Instagram' }))
    assert.match(html, /INSTAGRAM • PHOTO/)
    assert.doesNotMatch(html, /carousel-dock/)
    assert.doesNotMatch(html, /ALL IMAGES \(\.ZIP\)/)
    assert.match(html, /DOWNLOAD IMAGE/)
    assert.match(html, /Original.*★/)
    assert.match(html, /JPG/)
    assert.match(html, /PNG/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders Instagram mixed carousel with [ VIDEO ] badge and dynamic CTA buttons', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = {
      title: 'Instagram Mixed Album',
      platform: 'instagram',
      media_type: 'gallery',
      image_count: 2,
      items: [
        { index: 0, type: 'image', url: 'https://example.com/p1.jpg' },
        { index: 1, type: 'video', url: 'https://example.com/v2.mp4' },
      ],
      available_formats: ['image'],
    }

    // Viewing item 0 (photo)
    const photoHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media, platform: 'Instagram' }))
    assert.match(photoHtml, /INSTAGRAM • CAROUSEL • 2 ITEMS/)
    assert.match(photoHtml, /carousel-dock/)
    assert.match(photoHtml, /CURRENT IMAGE/)
    assert.match(photoHtml, /ALL IMAGES \(1 PHOTOS \.ZIP\)|CURRENT IMAGE/)
    assert.match(photoHtml, /IMAGE FORMAT/)

    // If viewing item 1 (video): we pass media where first item is video to test static render of video slide
    const videoFirstMedia = {
      ...media,
      items: [
        { index: 0, type: 'video', url: 'https://example.com/v2.mp4' },
        { index: 1, type: 'image', url: 'https://example.com/p1.jpg' },
      ],
    }
    const videoHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media: videoFirstMedia, platform: 'Instagram' }))
    assert.match(videoHtml, /video-badge-overlay/)
    assert.match(videoHtml, /VIDEO/)
    assert.match(videoHtml, /DOWNLOAD VIDEO/)
    // Image format options hidden when viewing a video item
    assert.doesNotMatch(videoHtml, /IMAGE FORMAT/)
  } finally {
    await server.close()
  }
})

test('ResultCard mixed carousel with 2+ photos shows note about excluded videos', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = {
      title: 'Instagram Mixed with 2 photos',
      platform: 'instagram',
      media_type: 'gallery',
      image_count: 2,
      items: [
        { index: 0, type: 'image', url: 'https://example.com/p1.jpg' },
        { index: 1, type: 'video', url: 'https://example.com/v2.mp4' },
        { index: 2, type: 'image', url: 'https://example.com/p3.jpg' },
      ],
      available_formats: ['image'],
    }

    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'IMAGE', quality: 'Original', media, platform: 'Instagram' }))
    assert.match(html, /ALL IMAGES \(2 PHOTOS \.ZIP\)/)
    assert.match(html, /mixed-media-note/)
    assert.match(html, /1 video excluded from ZIP/)
  } finally {
    await server.close()
  }
})

test('UrlInput defines dedicated login_required error for Instagram private/auth walls', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { errors } = await server.ssrLoadModule('/src/components/UrlInput.jsx')
    assert.ok(errors.login_required)
    assert.equal(errors.login_required[0], 'INSTAGRAM LOGIN REQUIRED')
    assert.equal(errors.login_required[1], 'This post cannot be accessed anonymously.')
  } finally {
    await server.close()
  }
})

test('UrlInput defines dedicated extractor_error for media extractor configuration or subprocess errors', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { errors } = await server.ssrLoadModule('/src/components/UrlInput.jsx')
    assert.ok(errors.extractor_error)
    assert.equal(errors.extractor_error[0], 'MEDIA EXTRACTOR ERROR')
    assert.equal(errors.extractor_error[1], 'The media extractor is temporarily unavailable.')

    // Assert DOM markup with extractor_error
    const [title, desc] = errors.extractor_error
    const markup = `<div id="url-error" class="error-card pixel-border" role="alert"><strong>${title}</strong><p>${desc}</p></div>`
    assert.match(markup, /MEDIA EXTRACTOR ERROR/)
    assert.match(markup, /The media extractor is temporarily unavailable\./)
  } finally {
    await server.close()
  }
})

// ── Phase 8.8.2.4: Persona-Inspired Kinetic UI Overhaul ──────────────────────

test('Header renders motion mode toggle button with DYNAMIC / CALM labels', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { Header } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(Header, { theme: 'dark', onToggle: () => {} }))
    assert.match(html, /theme-toggle/)
    assert.match(html, /DYNAMIC|CALM/)
    assert.match(html, /ONLINE/)
  } finally {
    await server.close()
  }
})

test('UrlInput renders magnetic analyze button with p5-analyze-btn and glitch text wrapper', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { UrlInput } = await loadModules(server)
    const html = renderToStaticMarkup(createElement(UrlInput))
    assert.match(html, /p5-analyze-btn/)
    assert.match(html, /glitch-text-wrapper/)
    assert.match(html, /ANALYZE/)
    assert.match(html, /p5-url-field/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders oversized format selector options with p5-format-grid', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'Persona Track', duration: 180, media_type: 'audio', available_formats: ['video', 'audio', 'image'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'MP3', quality: 'Best', media }))
    assert.match(html, /p5-format-grid/)
    assert.match(html, /p5-format-option/)
    assert.match(html, /AUDIO STREAM/)
    assert.match(html, /p5-result-card/)
  } finally {
    await server.close()
  }
})

test('LightboxModal renders accessible dialog with close button and keyboard hint', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { default: LightboxModal } = await server.ssrLoadModule('/src/components/kinetic/LightboxModal.jsx')
    const items = [
      { url: 'https://example.com/1.jpg', type: 'image' },
      { url: 'https://example.com/2.jpg', type: 'image' },
    ]
    const html = renderToStaticMarkup(createElement(LightboxModal, {
      isOpen: true,
      items,
      currentIndex: 0,
      title: 'Gallery Post',
    }))
    assert.match(html, /role="dialog"/)
    assert.match(html, /p5-lightbox-card/)
    assert.match(html, /Gallery Post/)
    assert.match(html, /1 \/ 2/)
    assert.match(html, /CLOSE/)
    assert.match(html, /KEYBOARD: \[←\/→\] NAVIGATE/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders packaging ZIP archiving state during multi-photo processing', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const galleryMedia = {
      title: 'TikTok Album',
      media_type: 'gallery',
      image_count: 8,
      images: Array.from({ length: 8 }, (_, i) => ({ index: i, url: `https://example.com/${i}.jpg` })),
      available_formats: ['image'],
    }
    const processingJob = { status: 'processing', progress: 100 }
    const html = renderToStaticMarkup(createElement(ResultCard, {
      phase: 'processing',
      format: 'IMAGE',
      quality: 'Original',
      media: galleryMedia,
      job: processingJob,
    }))
    assert.match(html, /PACKAGING 8 PHOTOS INTO \.ZIP \/\/ ARCHIVING/)
  } finally {
    await server.close()
  }
})














