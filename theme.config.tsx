import React from 'react'
import { useRouter } from 'next/router'
import { DocsThemeConfig, useConfig } from 'nextra-theme-docs'

const SITE_URL = 'https://developers.superhero.com'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span
        style={{
          display: 'inline-block',
          width: 20,
          height: 20,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
        }}
      />
      <strong style={{ fontWeight: 700 }}>Superhero</strong>
      <span style={{ opacity: 0.5 }}>Docs</span>
    </span>
  ),
  project: {
    link: 'https://github.com/superhero-com/superhero-agent-skill',
  },
  docsRepositoryBase:
    'https://github.com/Jeanclaudeaoun/superhero-developer/tree/main',
  footer: {
    text: (
      <span>
        Superhero Documentation ·{' '}
        <a href="https://superhero.com" target="_blank" rel="noreferrer">
          superhero.com
        </a>{' '}
        · Built on æternity
      </span>
    ),
  },
  editLink: { text: 'Edit this page on GitHub →' },
  feedback: { content: 'Question? Open an issue →' },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: { float: true, backToTop: true },
  darkMode: true,
  primaryHue: 265,
  useNextSeoProps() {
    const { asPath } = useRouter()
    return {
      titleTemplate: asPath === '/' ? 'Superhero Documentation' : '%s – Superhero Docs',
    }
  },
  head: function Head() {
    const { asPath } = useRouter()
    const { frontMatter, title } = useConfig()
    const url = `${SITE_URL}${asPath}`
    const description =
      (frontMatter as { description?: string })?.description ??
      'Documentation for Superhero — the on-chain attention market for social trends, built on æternity.'

    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title ? `${title} – Superhero Docs` : 'Superhero Documentation'} />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </>
    )
  },
}

export default config
