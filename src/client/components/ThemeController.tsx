import { MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

const ThemeController = () => {
  const [isDark, setIsDark] = useState(false)

  // Restore preference on mount
  useEffect(() => {
    setIsDark(localStorage.getItem(STORAGE_KEY) === 'dark')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dark = e.target.checked
    setIsDark(dark)
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }

  return (
    <label className="swap swap-rotate">
      {/* checked → applies data-theme="dark" via daisyui's theme-controller CSS */}
      <input
        type="checkbox"
        className="theme-controller"
        value="dark"
        checked={isDark}
        onChange={handleChange}
      />

      {/* sun = light mode */}
      <SunIcon className="swap-off size-6 fill-current" />

      {/* moon = dark mode */}
      <MoonIcon className="swap-on size-6 fill-current" />
    </label>
  )
}

export default ThemeController
