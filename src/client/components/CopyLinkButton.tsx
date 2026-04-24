import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'

interface CopyLinkButtonProps {
  url?: string
  className?: string
}

type State = 'idle' | 'copied' | 'error'

const defaultClass = cn(
  'inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
  'text-base-content/70 hover:bg-base-200 transition-colors',
)

export function CopyLinkButton({ url, className }: CopyLinkButtonProps) {
  const [state, setState] = useState<State>('idle')

  const handleCopy = async () => {
    const target = url ?? window.location.href
    try {
      await navigator.clipboard.writeText(target)
      setState('copied')
    } catch {
      setState('error')
    } finally {
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const titles = { idle: 'Copiar enlace', copied: '¡Copiado!', error: 'No se pudo copiar' }

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      aria-label="Copiar enlace"
      title={titles[state]}
      className={cn(defaultClass, state === 'error' && 'text-error  hover:bg-error/10', className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'copied' && (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <Check className="w-4 h-4 text-success" />
          </motion.span>
        )}
        {state === 'error' && (
          <motion.span
            key="error"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <X className="w-4 h-4 text-error" />
          </motion.span>
        )}
        {state === 'idle' && (
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
      <AnimatePresence mode="wait" initial={false}>
        {state === 'copied' && (
          <motion.span
            key="label-copied"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            Copiado
          </motion.span>
        )}
        {state === 'error' && (
          <motion.span
            key="label-error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            Error al copiar
          </motion.span>
        )}
        {state === 'idle' && (
          <motion.span
            key="label-copy"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            Copiar enlace
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
