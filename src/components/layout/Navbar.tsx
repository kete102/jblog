import React from 'react'
import Logo from '@/components/layout/Logo'
import Avatar from '@/components/blog/Avatar'
import { GoogleIcon } from '@/components/icons'
import { isVerifiedAuthor } from '@/lib/roles'
import type { User } from '@/db/schema'

interface NavbarProps {
  user?: User | null
}

// Inline script — runs immediately after the navbar HTML is parsed.
// Converts the CSS focus-within trick into a reliable click toggle that
// works on both desktop and mobile (touch devices drop focus on pointer-up,
// which collapses a focus-within dropdown before any item can be tapped).
const menuScript = /* js */`(function(){
  var btn = document.getElementById('nav-avatar-btn');
  var dd  = document.getElementById('nav-dropdown');
  if (!btn || !dd) return;

  function open() {
    dd.classList.remove('opacity-0','pointer-events-none');
    dd.classList.add('opacity-100','pointer-events-auto');
    btn.setAttribute('aria-expanded','true');
  }
  function close() {
    dd.classList.add('opacity-0','pointer-events-none');
    dd.classList.remove('opacity-100','pointer-events-auto');
    btn.setAttribute('aria-expanded','false');
  }
  function isOpen() { return !dd.classList.contains('opacity-0'); }

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  // Close on outside click or tap
  document.addEventListener('click', function(e) {
    if (!btn.contains(e.target) && !dd.contains(e.target)) close();
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });
})();`

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isVerifiedAuthor(user) && (
                <a
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
                >
                  Dashboard
                </a>
              )}

              <div className="relative">
                <button
                  id="nav-avatar-btn"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded="false"
                  className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                >
                  <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" ring />
                </button>

                {/* Dropdown — hidden by default, toggled by menuScript */}
                <div
                  id="nav-dropdown"
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 opacity-0 pointer-events-none transition-all duration-150"
                >
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  {isVerifiedAuthor(user) && (
                    <a
                      href="/dashboard"
                      role="menuitem"
                      className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Dashboard
                    </a>
                  )}
                  <a
                    href="/dashboard/profile"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Profile
                  </a>
                  {user.role === 'admin' && (
                    <a
                      href="/dashboard/admin"
                      role="menuitem"
                      className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Admin
                    </a>
                  )}
                  <div className="border-t border-zinc-100 mt-1">
                    <form method="POST" action="/auth/logout">
                      <button
                        type="submit"
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <script dangerouslySetInnerHTML={{ __html: menuScript }} />
            </>
          ) : (
            <a
              href="/auth/google"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium transition-all duration-200 hover:bg-indigo-700 hover:scale-[1.04] active:scale-[0.97]"
            >
              <GoogleIcon className="w-4 h-4" />
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
