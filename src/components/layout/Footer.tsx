import React from 'react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-100 mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              j
            </span>
            <span className="font-semibold text-zinc-800 text-sm">jblog</span>
          </a>

          {/* Links */}
          <nav className="flex items-center gap-5 text-sm text-zinc-500">
            <a href="/" className="hover:text-zinc-800 transition-colors">Home</a>
            <a href="/sitemap.xml" className="hover:text-zinc-800 transition-colors">Sitemap</a>
            <a href="/auth/google" className="hover:text-zinc-800 transition-colors">Write for us</a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-zinc-400">
            &copy; {year} jblog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
