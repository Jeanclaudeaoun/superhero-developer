import React from 'react'
import { useRouter } from 'next/router'
import { DocsThemeConfig, useConfig } from 'nextra-theme-docs'

// next.config.js resolves this: an explicit NEXT_PUBLIC_SITE_URL, else the
// project's real production domain from Vercel, else localhost.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
const OG_IMAGE = `${SITE_URL}/og-default.png`

const config: DocsThemeConfig = {
  logo: (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        letterSpacing: '-0.01em',
      }}
    >
      <img
        src="/superhero-mark.png"
        alt=""
        width={22}
        height={17}
        style={{ display: 'block' }}
      />
      <strong style={{ fontWeight: 700 }}>Superhero</strong>
      <span style={{ opacity: 0.45, fontWeight: 400 }}>Dev</span>
    </span>
  ),
  logoLink: '/',

  // The GitHub icon in the navbar points at the organisation, not at any one
  // repository — these docs cover the whole platform, not a single project.
  project: {
    link: 'https://github.com/superhero-com',
  },

  // No "edit this page" or feedback link: both would expose the repository this
  // site happens to be built from, which is not where readers should be sent.
  editLink: { component: null },
  feedback: { content: null },

  footer: {
    text: (
      <span style={{ opacity: 0.8 }}>
        <a href="https://superhero.com" target="_blank" rel="noreferrer">
          superhero.com
        </a>
        {' · Built on æternity'}
      </span>
    ),
  },

  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: { float: true, backToTop: true },
  darkMode: true,
  primaryHue: 220,

  useNextSeoProps() {
    const { asPath } = useRouter()
    return {
      titleTemplate:
        asPath === '/' ? 'Superhero Dev' : '%s – Superhero Dev',
    }
  },

  head: function Head() {
    const { asPath } = useRouter()
    const { frontMatter, title } = useConfig()
    const url = `${SITE_URL}${asPath}`
    const description =
      (frontMatter as { description?: string })?.description ??
      'Superhero is the on-chain attention market where you can discover, trade, and govern the trends you believe in — before everyone else.'
    const pageTitle = title ? `${title} – Superhero Dev` : 'Superhero Dev'

    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <meta name="theme-color" content="#1161FE" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Superhero Dev" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={OG_IMAGE} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={OG_IMAGE} />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Content image presentation.
         *
         * This lives here rather than in a stylesheet imported from a custom
         * pages/_app.tsx: that file existed only to pull in one CSS file, and
         * its AppProps typing tripped a duplicate-@types/react conflict that
         * failed the deployment build while passing locally. Nextra renders
         * this head fragment on every page, so one <style> does the same job
         * with no extra file and no typing surface.
         *
         * Pages use plain markdown image syntax, which keeps
         * scripts/lint-mdx.py able to stay strict about the stray `<` and `{`
         * in prose that actually break MDX compilation. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
main img { display:block; max-width:min(100%,640px); height:auto; margin:2.25rem auto; border-radius:14px; }
nav img { margin:0; border-radius:0; }
`,
          }}
        />
      </>
    )
  },
}

export default config
