// ─── CountUp — animates a number from 0 to `to` on mount ─────────────────────
import { useState, useEffect } from 'react'
import { animate } from 'framer-motion'
import { formatNumber } from '../lib/format'

interface CountUpProps {
  to: number
  duration?: number
}

export function CountUp({ to, duration = 1.2 }: CountUpProps) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return controls.stop
  }, [to, duration])

  return <>{formatNumber(value)}</>
}
