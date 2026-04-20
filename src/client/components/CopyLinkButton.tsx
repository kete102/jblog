// ─── CopyLinkButton — copy current URL to clipboard ──────────────────────────
import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyLinkButtonProps {
  url?: string
  className?: string
}

export function CopyLinkButton({ url, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const target = url ?? window.location.href
    try {
      await navigator.clipboard.writeText(target)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copiar enlace"
      title={copied ? '¡Copiado!' : 'Copiar enlace'}
      className={
        className ??
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 transition-colors'
      }
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copiado' : 'Copiar enlace'}
    </button>
  )
}
