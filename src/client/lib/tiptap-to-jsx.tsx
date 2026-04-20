// ─── Tiptap JSON → React JSX ─────────────────────────────────────────────────
// Converts a ProseMirror/Tiptap JSON document to React elements.
// Does NOT use dangerouslySetInnerHTML.
// Mirrors the logic in src/lib/tiptap.ts (which produces HTML strings).

import React from 'react'
import { lowlight } from './lowlight'

// ─── Internal types ───────────────────────────────────────────────────────────

interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TiptapNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: TiptapMark[]
  content?: TiptapNode[]
}

// Minimal hast-compatible types returned by lowlight
interface HastText {
  type: 'text'
  value: string
}

interface HastElement {
  type: 'element'
  tagName: string
  properties?: { className?: string[] }
  children?: (HastText | HastElement)[]
}

// ─── Hast (lowlight output) → React elements ─────────────────────────────────

function renderHastNodes(nodes: (HastText | HastElement)[], keyPrefix: string): React.ReactNode {
  return nodes.map((node, i) => {
    if (node.type === 'text') return node.value
    const cls = node.properties?.className?.join(' ') ?? ''
    return (
      <span key={`${keyPrefix}-${i}`} className={cls || undefined}>
        {renderHastNodes((node.children ?? []) as (HastText | HastElement)[], `${keyPrefix}-${i}`)}
      </span>
    )
  })
}

function renderCodeBlock(code: string, lang: string | undefined, key: string): React.ReactNode {
  let highlighted: React.ReactNode

  if (lang && lowlight.listLanguages().includes(lang)) {
    try {
      const tree = lowlight.highlight(lang, code)
      highlighted = renderHastNodes((tree.children ?? []) as (HastText | HastElement)[], key)
    } catch {
      highlighted = code
    }
  } else {
    highlighted = code
  }

  return (
    <pre key={key}>
      <code className={lang ? `language-${lang}` : undefined}>{highlighted}</code>
    </pre>
  )
}

// ─── Mark application ─────────────────────────────────────────────────────────

function applyMark(
  mark: TiptapMark,
  children: React.ReactNode,
  markKey: string | undefined,
): React.ReactNode {
  switch (mark.type) {
    case 'bold':
      return <strong key={markKey}>{children}</strong>
    case 'italic':
      return <em key={markKey}>{children}</em>
    case 'underline':
      return <u key={markKey}>{children}</u>
    case 'strike':
      return <s key={markKey}>{children}</s>
    case 'code':
      return <code key={markKey}>{children}</code>
    case 'highlight':
      return <mark key={markKey}>{children}</mark>
    case 'link': {
      const href = mark.attrs?.href as string | undefined
      return (
        <a key={markKey} href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    }
    default:
      return <span key={markKey}>{children}</span>
  }
}

// ─── Inline node renderer ─────────────────────────────────────────────────────

function renderInline(node: TiptapNode, key: string): React.ReactNode {
  if (node.type === 'hardBreak') return <br key={key} />

  if (node.type !== 'text') return null

  const text = node.text ?? ''
  const marks = node.marks ?? []

  if (marks.length === 0) return text

  // Apply marks from innermost (last) to outermost (first).
  // Only the outermost element gets the key so React can track the array item.
  let content: React.ReactNode = text
  for (let i = marks.length - 1; i >= 0; i--) {
    content = applyMark(marks[i], content, i === 0 ? key : undefined)
  }
  return content
}

// ─── Block node renderer ──────────────────────────────────────────────────────

function renderNode(node: TiptapNode, key: string): React.ReactNode {
  const children = () => (node.content ?? []).map((child, i) => renderInline(child, `${key}-${i}`))

  const blockChildren = () =>
    (node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`))

  switch (node.type) {
    case 'doc':
      return <React.Fragment key={key}>{blockChildren()}</React.Fragment>

    case 'paragraph':
      return <p key={key}>{children()}</p>

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2
      const safeLevel = Math.min(Math.max(level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6
      const Tag = `h${safeLevel}` as const
      return <Tag key={key}>{children()}</Tag>
    }

    case 'bulletList':
      return <ul key={key}>{blockChildren()}</ul>

    case 'orderedList':
      return <ol key={key}>{blockChildren()}</ol>

    case 'listItem':
      return <li key={key}>{blockChildren()}</li>

    case 'blockquote':
      return <blockquote key={key}>{blockChildren()}</blockquote>

    case 'codeBlock': {
      const lang = node.attrs?.language as string | undefined
      const code = (node.content ?? [])
        .filter((n) => n.type === 'text')
        .map((n) => n.text ?? '')
        .join('')
      return renderCodeBlock(code, lang, key)
    }

    case 'image': {
      const src = node.attrs?.src as string | undefined
      const alt = node.attrs?.alt as string | undefined
      const title = node.attrs?.title as string | undefined
      return (
        <img
          key={key}
          src={src}
          alt={alt ?? ''}
          title={title}
          className="rounded-lg max-w-full"
          loading="lazy"
        />
      )
    }

    case 'horizontalRule':
      return <hr key={key} />

    default:
      return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert a Tiptap/ProseMirror JSON document to React elements.
 * Returns null for null/undefined/empty docs.
 */
export function tiptapToJsx(doc: Record<string, unknown> | null | undefined): React.ReactNode {
  if (!doc || Object.keys(doc).length === 0) return null
  return renderNode(doc as unknown as TiptapNode, 'root')
}
