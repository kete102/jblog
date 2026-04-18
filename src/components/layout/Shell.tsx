import React from 'react'
import type { SeoProps } from '@/lib/seo'

interface ShellProps {
  children: React.ReactNode
  seo?: SeoProps
  clientBundle?: 'editor' | null
}

export default function Shell({ children, seo, clientBundle }: ShellProps) {
  const title = seo?.title ?? 'jblog'
  const description = seo?.description ?? 'A modern blog platform for writers who care about their craft.'
  const image = seo?.image
  const url = seo?.url

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Canonical */}
        {url && <link rel="canonical" href={url} />}

        {/* Open Graph */}
        <meta property="og:type" content={seo?.type ?? 'website'} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {image && <meta property="og:image" content={image} />}
        {url && <meta property="og:url" content={url} />}
        <meta property="og:site_name" content="jblog" />

        {/* Twitter Card */}
        <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}

        {/* Article-specific meta */}
        {seo?.publishedTime && (
          <meta property="article:published_time" content={seo.publishedTime} />
        )}
        {seo?.author && <meta property="article:author" content={seo.author} />}
        {seo?.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* No index */}
        {seo?.noIndex && <meta name="robots" content="noindex, nofollow" />}

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* Stylesheet */}
        <link rel="stylesheet" href="/styles.css" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        {children}
        {clientBundle && (
          <script type="module" src={`/js/${clientBundle}.js`} />
        )}
      </body>
    </html>
  )
}
