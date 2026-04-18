/**
 * Converts a Tiptap/ProseMirror JSON document to HTML string.
 * Runs entirely server-side with no DOM dependency.
 */

type Mark = {
  type: string
  attrs?: Record<string, unknown>
}

type Node = {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Mark[]
  content?: Node[]
}

function applyMarks(text: string, marks: Mark[]): string {
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong>${acc}</strong>`
      case 'italic':
        return `<em>${acc}</em>`
      case 'underline':
        return `<u>${acc}</u>`
      case 'strike':
        return `<s>${acc}</s>`
      case 'code':
        return `<code class="bg-zinc-100 text-zinc-800 px-1 py-0.5 rounded text-sm font-mono">${acc}</code>`
      case 'highlight':
        return `<mark class="bg-yellow-100 text-yellow-900 px-0.5 rounded">${acc}</mark>`
      case 'link': {
        const href = String(mark.attrs?.href ?? '#')
        const target = mark.attrs?.target ? ` target="${mark.attrs.target}"` : ''
        return `<a href="${href}"${target} class="text-indigo-600 underline underline-offset-2 hover:text-indigo-800">${acc}</a>`
      }
      default:
        return acc
    }
  }, text)
}

function renderNode(node: Node): string {
  switch (node.type) {
    case 'doc':
      return renderNodes(node.content ?? [])

    case 'paragraph': {
      const inner = renderNodes(node.content ?? [])
      return inner ? `<p>${inner}</p>` : '<p><br></p>'
    }

    case 'heading': {
      const level = Number(node.attrs?.level ?? 2)
      const inner = renderNodes(node.content ?? [])
      const cls = [
        'font-bold tracking-tight',
        level === 1 ? 'text-3xl mt-8 mb-4' : '',
        level === 2 ? 'text-2xl mt-8 mb-3' : '',
        level === 3 ? 'text-xl mt-6 mb-2' : '',
        level === 4 ? 'text-lg mt-4 mb-2' : '',
      ]
        .filter(Boolean)
        .join(' ')
      return `<h${level} class="${cls}">${inner}</h${level}>`
    }

    case 'text': {
      const escaped = escapeHtml(node.text ?? '')
      return node.marks?.length ? applyMarks(escaped, node.marks) : escaped
    }

    case 'hardBreak':
      return '<br>'

    case 'bulletList':
      return `<ul class="list-disc list-outside pl-6 space-y-1 my-4">${renderNodes(node.content ?? [])}</ul>`

    case 'orderedList':
      return `<ol class="list-decimal list-outside pl-6 space-y-1 my-4">${renderNodes(node.content ?? [])}</ol>`

    case 'listItem':
      return `<li>${renderNodes(node.content ?? [])}</li>`

    case 'blockquote':
      return `<blockquote class="border-l-4 border-indigo-300 pl-4 italic text-zinc-600 my-6">${renderNodes(node.content ?? [])}</blockquote>`

    case 'codeBlock': {
      const lang = node.attrs?.language ? ` data-language="${node.attrs.language}"` : ''
      const inner = escapeHtml(
        (node.content ?? []).map((n) => n.text ?? '').join(''),
      )
      return `<pre class="bg-zinc-900 text-zinc-100 rounded-xl p-4 overflow-x-auto my-6 text-sm font-mono"${lang}><code>${inner}</code></pre>`
    }

    case 'image': {
      const src = String(node.attrs?.src ?? '')
      const alt = String(node.attrs?.alt ?? '')
      const title = node.attrs?.title ? ` title="${node.attrs.title}"` : ''
      return `<figure class="my-8"><img src="${src}" alt="${alt}"${title} class="rounded-xl w-full object-cover" loading="lazy" /></figure>`
    }

    case 'horizontalRule':
      return '<hr class="my-8 border-zinc-200" />'

    default:
      return renderNodes(node.content ?? [])
  }
}

function renderNodes(nodes: Node[]): string {
  return nodes.map(renderNode).join('')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function tiptapToHtml(doc: Record<string, unknown>): string {
  if (!doc || typeof doc !== 'object') return ''
  return renderNode(doc as Node)
}

/** Estimate reading time in minutes from a Tiptap document */
export function estimateReadingTime(doc: Record<string, unknown>): number {
  const html = tiptapToHtml(doc)
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
