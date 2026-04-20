import { describe, expect, it } from 'bun:test'
import { BOT_UA_RE, buildMetaHtml } from './seo'

// ─── BOT_UA_RE ────────────────────────────────────────────────────────────────

describe('BOT_UA_RE', () => {
  const bots = [
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient/4.5.2 +http://www.linkedin.com)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Discordbot/2.0; +https://discordapp.com',
    'TelegramBot (like TwitterBot)',
    'WhatsApp/2.24.5 A',
    'Applebot/0.1',
    'ia_archiver (+http://www.alexa.com/site/help/webmasters)',
    'SemrushBot/7~bl',
    'AhrefsBot/7.0; +http://ahrefs.com/robot/',
    'MJ12bot/v1.4.8 (http://majestic12.co.uk/bot.php)',
    'DotBot/1.2',
  ]

  for (const ua of bots) {
    it(`matches bot UA: "${ua.slice(0, 50)}"`, () => {
      expect(BOT_UA_RE.test(ua)).toBe(true)
    })
  }

  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  ]

  for (const ua of browsers) {
    it(`does not match browser UA: "${ua.slice(0, 50)}"`, () => {
      expect(BOT_UA_RE.test(ua)).toBe(false)
    })
  }

  it('is case-insensitive', () => {
    expect(BOT_UA_RE.test('GOOGLEBOT')).toBe(true)
    expect(BOT_UA_RE.test('googlebot')).toBe(true)
  })
})

// ─── buildMetaHtml ────────────────────────────────────────────────────────────

describe('buildMetaHtml', () => {
  const BASE = {
    title: 'Test Post',
    description: 'A test description.',
    canonicalUrl: 'https://example.com/post/test',
  }

  it('includes the title in a <title> tag', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<title>Test Post</title>')
  })

  it('includes description in <meta name="description">', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<meta name="description" content="A test description." />')
  })

  it('includes og:title', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<meta property="og:title" content="Test Post" />')
  })

  it('includes og:description', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<meta property="og:description" content="A test description." />')
  })

  it('includes og:url with the canonical URL', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<meta property="og:url" content="https://example.com/post/test" />')
  })

  it('defaults og:type to "website"', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<meta property="og:type" content="website" />')
  })

  it('uses the provided og:type', () => {
    const html = buildMetaHtml({ ...BASE, type: 'article' })
    expect(html).toContain('<meta property="og:type" content="article" />')
  })

  it('includes a canonical link tag', () => {
    const html = buildMetaHtml(BASE)
    expect(html).toContain('<link rel="canonical" href="https://example.com/post/test" />')
  })

  it('includes og:image when provided', () => {
    const html = buildMetaHtml({ ...BASE, image: 'https://example.com/img.jpg' })
    expect(html).toContain('<meta property="og:image" content="https://example.com/img.jpg" />')
  })

  it('omits og:image when not provided', () => {
    const html = buildMetaHtml(BASE)
    expect(html).not.toContain('og:image')
  })

  it('omits og:image when image is null', () => {
    const html = buildMetaHtml({ ...BASE, image: null })
    expect(html).not.toContain('og:image')
  })

  it('escapes & in title', () => {
    const html = buildMetaHtml({ ...BASE, title: 'Cats & Dogs' })
    expect(html).toContain('Cats &amp; Dogs')
    expect(html).not.toContain('Cats & Dogs')
  })

  it('escapes " in description', () => {
    const html = buildMetaHtml({ ...BASE, description: 'Say "hello"' })
    expect(html).toContain('Say &quot;hello&quot;')
  })

  it('escapes < in values', () => {
    const html = buildMetaHtml({ ...BASE, title: '<XSS>' })
    // The esc helper escapes &, " and < (> is harmless in HTML and left as-is)
    expect(html).toContain('&lt;XSS>')
    expect(html).not.toContain('<XSS>')
  })
})
