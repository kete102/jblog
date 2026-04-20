import { Hono } from 'hono'
import { marked } from 'marked'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const changelogRouter = new Hono()

changelogRouter.get('/changelog', async (c) => {
  const user = c.get('user')

  const markdown = await Bun.file('CHANGELOG.md').text()
  // Strip the first heading ("# Changelog") from the markdown before rendering
  // to avoid a duplicate title — the page already renders an <h1> in JSX.
  const markdownWithoutTitle = markdown.replace(/^#\s+[^\n]+\n/, '')
  const html = marked.parse(markdownWithoutTitle) as string

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3">
              Changelog
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              A running record of everything built, fixed, and improved.
            </p>
          </div>

          {/* Rendered markdown */}
          <article
            className="prose prose-zinc max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Footer CTA */}
          <div className="mt-14 pt-8 border-t border-zinc-100">
            <p className="text-sm text-zinc-500">
              Found a bug or have a suggestion?{' '}
              <a
                href="https://github.com/kete102/jblog/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Open an issue on GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>,
    {
      seo: {
        title: 'Changelog — jblog',
        description: 'A running record of everything built, fixed, and improved in jblog.',
      },
    },
  )
})

export default changelogRouter
