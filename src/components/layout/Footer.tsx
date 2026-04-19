import React from 'react'
import Logo from '@/components/layout/Logo'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-100 mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />

          {/* Links */}
          <nav className="flex items-center gap-5 text-sm text-zinc-500">
            <a href="/" className="hover:text-zinc-800 transition-colors">Home</a>
            <a href="/changelog" className="hover:text-zinc-800 transition-colors">Changelog</a>
            <a href="/sitemap.xml" className="hover:text-zinc-800 transition-colors">Sitemap</a>
            <a href="/dashboard/become-author" className="hover:text-zinc-800 transition-colors">Write for us</a>
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
