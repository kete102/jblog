export interface SeoProps {
  title: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
  tags?: string[]
  noIndex?: boolean
}

const SITE_NAME = 'jblog'
const DEFAULT_DESCRIPTION = 'A modern blog platform for writers who care about their craft.'

export function buildSeoTags(props: SeoProps) {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image,
    url,
    type = 'website',
    publishedTime,
    author,
    tags = [],
    noIndex = false,
  } = props

  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`

  return {
    title: fullTitle,
    description,
    image,
    url,
    type,
    publishedTime,
    author,
    tags,
    noIndex,
    siteName: SITE_NAME,
  }
}

export function jsonLdArticle(props: {
  title: string
  description?: string
  url: string
  image?: string
  publishedTime?: string
  authorName?: string
  authorUrl?: string
}) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.title,
    description: props.description,
    url: props.url,
    image: props.image,
    datePublished: props.publishedTime,
    author: props.authorName
      ? {
          '@type': 'Person',
          name: props.authorName,
          url: props.authorUrl,
        }
      : undefined,
  })
}

export function jsonLdBlog(props: { name: string; url: string; description: string }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: props.name,
    url: props.url,
    description: props.description,
  })
}
