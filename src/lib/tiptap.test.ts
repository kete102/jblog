import { describe, expect, it } from 'bun:test'
import { estimateReadingTime, tiptapToHtml } from './tiptap'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function doc(...content: object[]) {
  return { type: 'doc', content }
}
function p(...content: object[]) {
  return { type: 'paragraph', content }
}
function text(t: string, marks?: object[]) {
  return marks ? { type: 'text', text: t, marks } : { type: 'text', text: t }
}
function heading(level: number, ...content: object[]) {
  return { type: 'heading', attrs: { level }, content }
}

// ─── tiptapToHtml ─────────────────────────────────────────────────────────────

describe('tiptapToHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(tiptapToHtml({})).toBe('')
    expect(tiptapToHtml(null as unknown as Record<string, unknown>)).toBe('')
  })

  it('renders an empty doc as empty string', () => {
    expect(tiptapToHtml(doc())).toBe('')
  })

  it('renders a simple paragraph', () => {
    const html = tiptapToHtml(doc(p(text('Hello world'))))
    expect(html).toBe('<p>Hello world</p>')
  })

  it('renders an empty paragraph as <p><br></p>', () => {
    const html = tiptapToHtml(doc({ type: 'paragraph' }))
    expect(html).toBe('<p><br></p>')
  })

  it('renders h2 with correct classes', () => {
    const html = tiptapToHtml(doc(heading(2, text('Title'))))
    expect(html).toContain('<h2 ')
    expect(html).toContain('text-2xl')
    expect(html).toContain('>Title</h2>')
  })

  it('renders h3 with correct classes', () => {
    const html = tiptapToHtml(doc(heading(3, text('Sub'))))
    expect(html).toContain('<h3 ')
    expect(html).toContain('text-xl')
  })

  it('renders hardBreak as <br>', () => {
    const html = tiptapToHtml(doc(p(text('a'), { type: 'hardBreak' }, text('b'))))
    expect(html).toBe('<p>a<br>b</p>')
  })

  it('renders a bullet list', () => {
    const html = tiptapToHtml(
      doc({
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [p(text('one'))] },
          { type: 'listItem', content: [p(text('two'))] },
        ],
      }),
    )
    expect(html).toContain('<ul ')
    expect(html).toContain('<li>')
    expect(html).toContain('one')
    expect(html).toContain('two')
  })

  it('renders an ordered list', () => {
    const html = tiptapToHtml(
      doc({
        type: 'orderedList',
        content: [{ type: 'listItem', content: [p(text('first'))] }],
      }),
    )
    expect(html).toContain('<ol ')
    expect(html).toContain('<li>')
  })

  it('renders a blockquote', () => {
    const html = tiptapToHtml(doc({ type: 'blockquote', content: [p(text('quote'))] }))
    expect(html).toContain('<blockquote ')
    expect(html).toContain('quote')
  })

  it('renders a codeBlock', () => {
    const html = tiptapToHtml(
      doc({
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [{ type: 'text', text: 'const x = 1' }],
      }),
    )
    expect(html).toContain('<pre ')
    expect(html).toContain('data-language="typescript"')
    expect(html).toContain('<code>')
    expect(html).toContain('const x = 1')
  })

  it('escapes HTML inside codeBlock content', () => {
    const html = tiptapToHtml(
      doc({ type: 'codeBlock', content: [{ type: 'text', text: '<script>alert(1)</script>' }] }),
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('renders an image inside a figure', () => {
    const html = tiptapToHtml(
      doc({ type: 'image', attrs: { src: '/img.png', alt: 'Photo', title: 'A photo' } }),
    )
    expect(html).toContain('<figure')
    expect(html).toContain('src="/img.png"')
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('title="A photo"')
  })

  it('renders a horizontal rule', () => {
    const html = tiptapToHtml(doc({ type: 'horizontalRule' }))
    expect(html).toContain('<hr ')
  })

  it('falls through unknown node types by rendering their children', () => {
    const html = tiptapToHtml(doc({ type: 'unknownNode', content: [p(text('inside'))] }))
    expect(html).toContain('<p>inside</p>')
  })

  // ── Marks ────────────────────────────────────────────────────────────────

  it('applies bold mark', () => {
    const html = tiptapToHtml(doc(p(text('hi', [{ type: 'bold' }]))))
    expect(html).toContain('<strong>hi</strong>')
  })

  it('applies italic mark', () => {
    const html = tiptapToHtml(doc(p(text('hi', [{ type: 'italic' }]))))
    expect(html).toContain('<em>hi</em>')
  })

  it('applies underline mark', () => {
    const html = tiptapToHtml(doc(p(text('hi', [{ type: 'underline' }]))))
    expect(html).toContain('<u>hi</u>')
  })

  it('applies strikethrough mark', () => {
    const html = tiptapToHtml(doc(p(text('hi', [{ type: 'strike' }]))))
    expect(html).toContain('<s>hi</s>')
  })

  it('applies inline code mark', () => {
    const html = tiptapToHtml(doc(p(text('x', [{ type: 'code' }]))))
    expect(html).toContain('<code ')
    expect(html).toContain('x</code>')
  })

  it('applies highlight mark', () => {
    const html = tiptapToHtml(doc(p(text('hi', [{ type: 'highlight' }]))))
    expect(html).toContain('<mark ')
    expect(html).toContain('hi</mark>')
  })

  it('applies link mark with href', () => {
    const html = tiptapToHtml(
      doc(p(text('click', [{ type: 'link', attrs: { href: 'https://example.com' } }]))),
    )
    expect(html).toContain('<a href="https://example.com"')
    expect(html).toContain('click</a>')
  })

  it('applies link mark with target="_blank"', () => {
    const html = tiptapToHtml(
      doc(p(text('go', [{ type: 'link', attrs: { href: '/path', target: '_blank' } }]))),
    )
    expect(html).toContain('target="_blank"')
  })

  it('ignores unknown marks and returns the text unchanged', () => {
    const html = tiptapToHtml(doc(p(text('plain', [{ type: 'unknownMark' }]))))
    expect(html).toContain('plain')
  })

  // ── HTML escaping ────────────────────────────────────────────────────────

  it('escapes & < > " \' in text content', () => {
    const html = tiptapToHtml(doc(p(text('<script>alert("XSS&\'s")</script>'))))
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;')
    expect(html).toContain('&#039;')
    expect(html).not.toContain('<script>')
  })
})

// ─── estimateReadingTime ──────────────────────────────────────────────────────

describe('estimateReadingTime', () => {
  it('returns at least 1 minute for empty or very short content', () => {
    expect(estimateReadingTime(doc())).toBe(1)
    expect(estimateReadingTime(doc(p(text('Hi'))))).toBe(1)
  })

  it('returns 1 minute for ~200 words', () => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ')
    const result = estimateReadingTime(doc(p(text(words))))
    expect(result).toBe(1)
  })

  it('returns 2 minutes for ~400 words', () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ')
    const result = estimateReadingTime(doc(p(text(words))))
    expect(result).toBe(2)
  })
})
