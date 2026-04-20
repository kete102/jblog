// ─── PostEditor — Tiptap-powered post editor ─────────────────────────────────
// Migrated from src/client/editor.tsx.
// Changes vs old version:
//   - Receives data as props (no DOM script-tag bootstrap)
//   - API URLs updated to new JSON API routes
//   - Navigation uses TanStack Router's useNavigate
//   - Toolbar icons replaced with lucide-react
//   - slugify package used for slug generation
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TiptapLink from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Terminal,
  Minus,
  Link2,
  ImageIcon,
  ArrowLeft,
} from 'lucide-react'
import { lowlight } from '../../lib/lowlight'
import type { Tag } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostEditorProps {
  postId?: string | null
  title?: string
  slug?: string
  excerpt?: string
  coverImageUrl?: string
  content?: Record<string, unknown>
  status?: 'draft' | 'published'
  tagIds?: string[]
  allTags: Tag[]
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

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

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const handleLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL del enlace:', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
    }
  }

  const handleImage = () => {
    const url = window.prompt('URL de la imagen:', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-zinc-200 bg-white sticky top-0 z-10">
      {/* Text marks */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código en línea">
        <Code className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Resaltado">
        <Highlighter className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Encabezado 2">
        <Heading2 className="w-4 h-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Encabezado 3">
        <Heading3 className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista con viñetas">
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Block nodes */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
        <Quote className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloque de código">
        <Terminal className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Línea horizontal">
        <Minus className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Link + Image */}
      <ToolbarBtn onClick={handleLink} active={editor.isActive('link')} title="Enlace">
        <Link2 className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={handleImage} active={false} title="Imagen">
        <ImageIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>

      {/* Word count */}
      <div className="ml-auto text-xs text-zinc-400 pr-1 whitespace-nowrap">
        {editor.storage.characterCount?.words?.() ?? 0} palabras
      </div>
    </div>
  )
}

// ─── PostEditor ───────────────────────────────────────────────────────────────

export function PostEditor({
  postId: initialPostId = null,
  title: initialTitle = '',
  slug: initialSlug = '',
  excerpt: initialExcerpt = '',
  coverImageUrl: initialCover = '',
  content: initialContent,
  status: initialStatus = 'draft',
  tagIds: initialTagIds = [],
  allTags,
}: PostEditorProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initialTitle)
  const [slug, setSlug] = useState(initialSlug)
  const [slugTouched, setSlugTouched] = useState(!!initialPostId)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [coverImageUrl, setCoverImageUrl] = useState(initialCover)
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus)
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const postIdRef = useRef<string | null>(initialPostId ?? null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TiptapLink.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Empieza a escribir tu publicación…' }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent && Object.keys(initialContent).length ? initialContent : undefined,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-zinc max-w-none focus:outline-none px-8 py-6',
      },
    },
  })

  // Auto-derive slug from title for new posts
  useEffect(() => {
    if (!slugTouched) setSlug(makeSlug(title))
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

    try {
      if (id) {
        // Update existing post
        const res = await fetch(`/api/dashboard/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, slug, excerpt, coverImageUrl, content, status, tagIds }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error((json as { error?: string }).error ?? 'Error al guardar')
        }
      } else {
        // Create new post
        const res = await fetch('/api/dashboard/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title, slug, excerpt, coverImageUrl, content, status, tagIds }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error((json as { error?: string }).error ?? 'Error al guardar')
        }
        const json = (await res.json()) as { id: string }
        postIdRef.current = json.id
        // Redirect to edit page without full reload
        void navigate({
          to: '/dashboard/post/$id/edit',
          params: { id: json.id },
          replace: true,
        })
      }

      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar')
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }, [editor, saving, title, slug, excerpt, coverImageUrl, status, tagIds, navigate])

  // Keyboard shortcut: Cmd/Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [save])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Panel
        </Link>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.span key="saving" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }} className="text-xs text-zinc-400">
                Guardando…
              </motion.span>
            ) : saveState === 'saved' ? (
              <motion.span key="saved" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }} className="text-xs text-green-600 font-medium">
                Guardado
              </motion.span>
            ) : saveState === 'error' && errorMsg ? (
              <motion.span key="error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }} className="text-xs text-red-500">
                {errorMsg}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </header>

      {/* Two-column on md+, stacked on mobile */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0">
        {/* Left: title + editor */}
        <div className="flex-1 flex flex-col md:overflow-hidden border-b border-zinc-200 md:border-b-0 md:border-r min-h-[60vh] md:min-h-0">
          <div className="px-8 pt-8 pb-4 shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la publicación…"
              className="w-full text-3xl font-bold text-zinc-900 placeholder-zinc-300 bg-transparent border-none outline-none resize-none"
            />
          </div>
          <Toolbar editor={editor} />
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right: metadata panel */}
        <div className="w-full md:w-72 md:shrink-0 md:overflow-y-auto bg-zinc-50">
          <div className="p-5 space-y-5">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Slug
                </label>
                {slugTouched ? (
                  <button
                    type="button"
                    onClick={() => { setSlug(makeSlug(title)); setSlugTouched(false) }}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    Restablecer automático
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">Automático</span>
                )}
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
                placeholder="post-slug"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Extracto
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Un breve resumen…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                URL de la imagen de portada
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
                  alt="Vista previa de portada"
                  className="mt-2 w-full h-24 object-cover rounded-lg"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => {
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

            {/* Save button (also in header) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <p className="text-xs text-zinc-400 mt-2 text-center">o presiona ⌘S / Ctrl+S</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
