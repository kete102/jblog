import { Hono } from 'hono'
import { marked } from 'marked'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const changelogRouter = new Hono()

changelogRouter.get('/changelog', async (c) => {
  const user = c.get('user')

  const markdown = await Bun.file('CHANGELOG.md').text()
  const html = marked.parse(markdown) as string

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3">
              Historial de cambios
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Un registro de todo lo que se ha construido, corregido y mejorado.
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
              ¿Encontraste un error o tienes una sugerencia?{' '}
              <a
                href="https://github.com/kete102/jblog/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Abre un issue en GitHub
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
        title: 'Historial de cambios — Destellos de luz',
        description: 'Un registro de todo lo que se ha construido, corregido y mejorado en Destellos de luz.',
      },
    },
  )
})

export default changelogRouter
