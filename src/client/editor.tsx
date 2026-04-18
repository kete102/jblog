/**
 * Client-side editor bundle.
 * Mounts a Tiptap-powered editor into #editor-root.
 * Initial data is read from <script id="editor-data" type="application/json">.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagOption {
  id: string
  name: string
  slug: string
}

interface EditorData {
  postId: string | null
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  content: Record<string, unknown>
  status: 'draft' | 'published'
  tagIds: string[]
  allTags: TagOption[]
}

// ─── Lowlight (syntax highlighting) ──────────────────────────────────────────

const lowlight = createLowlight(common)

// ─── Slug helper ─────────────────────────────────────────────────────────────

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={`toolbar-btn${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-zinc-200 mx-0.5" />
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const handleLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL:', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
    }
  }

  const handleImage = () => {
    const url = window.prompt('Image URL:', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-zinc-200 bg-white sticky top-0 z-10">
      {/* Text marks */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" strokeLinecap="round"/>
          <line x1="4" y1="21" x2="20" y2="21" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6" strokeLinecap="round"/>
          <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive('highlight')}
        title="Highlight"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.62 12L12 9.62 19 16.62 16.62 19zM3 21v-3l4-4 3 3-4 4z"/>
        </svg>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <span className="text-xs font-bold leading-none">H2</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <span className="text-xs font-bold leading-none">H3</span>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="9" y1="6" x2="20" y2="6" strokeLinecap="round"/>
          <line x1="9" y1="12" x2="20" y2="12" strokeLinecap="round"/>
          <line x1="9" y1="18" x2="20" y2="18" strokeLinecap="round"/>
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="10" y1="6" x2="21" y2="6" strokeLinecap="round"/>
          <line x1="10" y1="12" x2="21" y2="12" strokeLinecap="round"/>
          <line x1="10" y1="18" x2="21" y2="18" strokeLinecap="round"/>
          <text x="2" y="8" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">1.</text>
          <text x="2" y="14" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">2.</text>
          <text x="2" y="20" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">3.</text>
        </svg>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Block nodes */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code block"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="4 17 10 11 4 5"/>
          <line x1="12" y1="19" x2="20" y2="19" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
        title="Horizontal rule"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Link + Image */}
      <ToolbarBtn
        onClick={handleLink}
        active={editor.isActive('link')}
        title="Link"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={handleImage}
        active={false}
        title="Image"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </ToolbarBtn>

      {/* Word count */}
      <div className="ml-auto text-xs text-zinc-400 pr-1 whitespace-nowrap">
        {editor.storage.characterCount?.words?.() ?? 0} words
      </div>
    </div>
  )
}

// ─── Main editor component ────────────────────────────────────────────────────

function EditorApp({ data }: { data: EditorData }) {
  const [title, setTitle] = useState(data.title)
  const [slug, setSlug] = useState(data.slug)
  const [slugTouched, setSlugTouched] = useState(!!data.postId)
  const [excerpt, setExcerpt] = useState(data.excerpt)
  const [coverImageUrl, setCoverImageUrl] = useState(data.coverImageUrl)
  const [status, setStatus] = useState<'draft' | 'published'>(data.status)
  const [tagIds, setTagIds] = useState<string[]>(data.tagIds)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const postIdRef = useRef<string | null>(data.postId)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing your post…' }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: data.content && Object.keys(data.content).length ? data.content : undefined,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-zinc max-w-none focus:outline-none px-8 py-6',
      },
    },
  })

  // Auto-derive slug from title for new posts
  useEffect(() => {
    if (!slugTouched) {
      setSlug(makeSlug(title))
    }
  }, [title, slugTouched])

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const save = useCallback(async () => {
    if (!editor || saving) return
    setSaving(true)
    setSaveState('idle')
    setErrorMsg(null)

    const content = editor.getJSON()
    const id = postIdRef.current
    const url = id ? `/dashboard/post/${id}` : '/dashboard/post'

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, excerpt, coverImageUrl, content, status, tagIds }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { message?: string }).message ?? 'Failed to save')
      }

      const json = await res.json() as { id?: string; ok?: boolean }

      // After creating a new post, update the URL to the edit page without a full reload
      if (!id && json.id) {
        postIdRef.current = json.id
        window.history.replaceState(null, '', `/dashboard/post/${json.id}/edit`)
      }

      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save')
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }, [editor, saving, title, slug, excerpt, coverImageUrl, status, tagIds])

  // Keyboard shortcut: Cmd/Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [save])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 shrink-0">
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </a>

        <div className="flex items-center gap-3">
          {saveState === 'saved' && (
            <span className="text-xs text-green-600 font-medium">Saved</span>
          )}
          {saveState === 'error' && errorMsg && (
            <span className="text-xs text-red-500">{errorMsg}</span>
          )}
          {saving && (
            <span className="text-xs text-zinc-400">Saving…</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </header>

      {/* Two-column content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: title + editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-200">
          {/* Title */}
          <div className="px-8 pt-8 pb-4 shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              className="w-full text-3xl font-bold text-zinc-900 placeholder-zinc-300 bg-transparent border-none outline-none resize-none"
            />
          </div>

          {/* Toolbar */}
          <Toolbar editor={editor} />

          {/* Editor content */}
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right: metadata panel */}
        <div className="w-72 shrink-0 overflow-y-auto bg-zinc-50">
          <div className="p-5 space-y-5">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugTouched(true)
                }}
                placeholder="post-slug"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Cover image URL */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Cover image URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="mt-2 w-full h-24 object-cover rounded-lg"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>

            {/* Tags */}
            {data.allTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {data.allTags.map((tag) => {
                    const active = tagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Save button (also in header, but convenient here) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <p className="text-xs text-zinc-400 mt-2 text-center">
                or press ⌘S / Ctrl+S
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function readEditorData(): EditorData {
  const el = document.getElementById('editor-data')
  if (!el) {
    return {
      postId: null,
      title: '',
      slug: '',
      excerpt: '',
      coverImageUrl: '',
      content: {},
      status: 'draft',
      tagIds: [],
      allTags: [],
    }
  }
  try {
    return JSON.parse(el.textContent ?? '{}') as EditorData
  } catch {
    return {
      postId: null,
      title: '',
      slug: '',
      excerpt: '',
      coverImageUrl: '',
      content: {},
      status: 'draft',
      tagIds: [],
      allTags: [],
    }
  }
}

const root = document.getElementById('editor-root')
if (root) {
  const data = readEditorData()
  createRoot(root).render(<EditorApp data={data} />)
}
