import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('Result Card renders API metadata and keeps the Download demo', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { isValidMediaUrl } = await server.ssrLoadModule('/src/components/UrlInput.jsx')
    const { default: ResultCard } = await server.ssrLoadModule('/src/components/ResultCard.jsx')
    const media = { title: 'Example Media', duration: 204, type: 'video' }

    assert.equal(isValidMediaUrl('https://example.com/video'), true)
    for (const invalid of ['', 'not a link', 'ftp://example.com/file', 'https://']) {
      assert.equal(isValidMediaUrl(invalid), false)
    }
    const longTitle = 'Example Media With A VeryLongUnbrokenSectionForTesting'
    assert.match(longTitle, /VeryLongUnbrokenSectionForTesting/)

    const longTitleHtml = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media: { title: longTitle, duration: 65, type: 'video' } }))
    assert.match(longTitleHtml, /VeryLongUnbrokenSectionForTesting/)
    assert.match(longTitleHtml, /01:05 · VIDEO/)

    const html = renderToStaticMarkup(createElement(ResultCard, { phase: 'result', format: 'VIDEO', quality: 'Best', media, onClear() {} }))
    assert.match(html, /DEMO PREVIEW/)
    assert.match(html, /Example Media/)
    assert.match(html, /03:24 · VIDEO/)
    assert.match(html, /VIDEO QUALITY/)
    assert.match(html, /Best/)
    assert.match(html, /aria-pressed="true"[^>]*>[^<]*<svg[^>]*>[\s\S]*<\/svg>VIDEO<\/button>/)

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

test('Analyze uses the API response and its error code', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const originalFetch = globalThis.fetch
  try {
    const { analyzeMedia } = await server.ssrLoadModule('/src/api/analyzeMedia.js')
    const controller = new AbortController()
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/analyze')
      assert.equal(options.method, 'POST')
      assert.deepEqual(JSON.parse(options.body), { url: 'https://example.com/video' })
      assert.equal(options.signal, controller.signal)
      return { ok: true, json: async () => ({ title: 'From API', duration: 65, type: 'video' }) }
    }
    assert.deepEqual(await analyzeMedia('https://example.com/video', controller.signal), { title: 'From API', duration: 65, type: 'video' })

    globalThis.fetch = async () => ({ ok: false, json: async () => ({ code: 'unsupported_media', message: 'Unsupported' }) })
    await assert.rejects(analyzeMedia('https://example.com/video', controller.signal), { code: 'unsupported_media' })
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})
