const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
})

/**
 * Canonical origin for og:url and the absolute social-card image URL.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL, if the deployment sets one explicitly. Use this
 *      once a custom domain is attached and should be the canonical one.
 *   2. VERCEL_PROJECT_PRODUCTION_URL, for Vercel previews only. Production is
 *      GitHub Pages, where the workflow sets NEXT_PUBLIC_SITE_URL from the
 *      SITE_URL repository variable.
 *   3. localhost, so a local build produces coherent (if local) tags rather
 *      than pointing at a domain that may not exist.
 */
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}

module.exports = withNextra({
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl(),
  },
  // Static export for GitHub Pages. Next's redirects() does not run on a
  // static host, so the two renamed pages redirect from small client pages
  // in pages/identity and pages/contracts instead.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
})
