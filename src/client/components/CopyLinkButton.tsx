// ─── CopyLinkButton — copy current URL to clipboard ──────────────────────────
import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../lib/cn'

interface CopyLinkButtonProps {
  url?: string
  className?: string
}

const defaultClass = cn(
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
  'text-base-content/70 hover:bg-base-200 transition-colors',
)

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
      className={cn(defaultClass, className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <Check className="w-4 h-4 text-success" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <Copy className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
      {copied ? 'Copiado' : 'Copiar enlace'}
    </button>
  )
}
