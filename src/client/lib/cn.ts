import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely — later classes win, conflicting utilities
 * are de-duplicated by tailwind-merge. Falsy values are ignored.
 *
 * Usage:
 *   cn('px-4 py-2', isActive && 'bg-primary text-primary-content')
 *   cn(baseClass, props.className)  // safe className prop merging
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return twMerge(...(inputs.filter(Boolean) as string[]))
}
