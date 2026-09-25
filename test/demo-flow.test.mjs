import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loadModules(server) {
  const { isValidMediaUrl } = await server.ssrLoadModule('/src/components/UrlInput.jsx')
  const { default: ResultCard } = await server.ssrLoadModule('/src/components/ResultCard.jsx')
  const { analyzeMedia } = await server.ssrLoadModule('/src/api/analyzeMedia.js')
  return { isValidMediaUrl, ResultCard, analyzeMedia }
}

// ── URL validation ────────────────────────────────────────────────────────────

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

// ── ResultCard with real server metadata ──────────────────────────────────────

test('ResultCard renders server-provided title, duration (mm:ss), and media_type', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)

    // Standard video media from server
    const videoMedia = { title: 'My Video', duration: 204, media_type: 'video', thumbnail: null, available_formats: ['video', 'audio'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media: videoMedia }))
    assert.match(html, /DEMO PREVIEW/)
    assert.match(html, /My Video/)
    assert.match(html, /03:24 · VIDEO/)
    assert.match(html, /VIDEO QUALITY/)
    assert.match(html, /Best/)

    // Long title wrapping
    const longMedia = { title: 'Example Media With A VeryLongUnbrokenSectionForTesting', duration: 65, media_type: 'video', thumbnail: null, available_formats: ['video', 'audio'] }
    const longHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media: longMedia }))
    assert.match(longHtml, /VeryLongUnbrokenSectionForTesting/)
    assert.match(longHtml, /01:05 · VIDEO/)
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

test('ResultCard only shows Format buttons in available_formats', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    // Audio-only media: only MP3 should appear
    const audioMedia = { title: 'song.mp3', duration: 180, media_type: 'audio', thumbnail: null, available_formats: ['audio'] }
    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'MP3', quality: '192 kbps', media: audioMedia }))
    assert.match(html, /MP3/)
    assert.doesNotMatch(html, /aria-pressed="true"[^>]*>[^<]*<svg[^>]*>[\s\S]*<\/svg>VIDEO<\/button>/)
  } finally {
    await server.close()
  }
})

test('ResultCard renders preparing and success states', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { ResultCard } = await loadModules(server)
    const media = { title: 'clip.mp4', duration: 120, media_type: 'video', thumbnail: null, available_formats: ['video', 'audio'] }

    const preparing = renderToStaticMarkup(createElement(ResultCard, { phase: 'preparing', format: 'MP3', quality: '320 kbps', media, onClear() {} }))
    assert.match(preparing, /PREPARING FILE/)
    assert.match(preparing, /MP3 · 320 kbps/)
    assert.doesNotMatch(preparing, /Download File/)

    const success = renderToStaticMarkup(createElement(ResultCard, { phase: 'success', format: 'MP3', quality: '320 kbps', media, onClear() {} }))
    assert.match(success, /DEMO READY/)
    assert.match(success, /Download File/)
    assert.match(success, /New Link/)
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

test('analyzeMedia throws with error code on non-ok response', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const originalFetch = globalThis.fetch
  try {
    const { analyzeMedia } = await loadModules(server)
    const controller = new AbortController()
    globalThis.fetch = async () => ({
      ok: false,
      json: async () => ({ code: 'unsupported_media', message: 'Unsupported' }),
    })
    await assert.rejects(analyzeMedia('https://example.com/x', controller.signal), { code: 'unsupported_media' })
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})
