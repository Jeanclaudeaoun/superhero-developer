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
 *   2. VERCEL_PROJECT_PRODUCTION_URL, which Vercel injects at build time and
 *      which always names the project's real production domain — including a
 *      custom domain once one exists. This keeps the tags correct with no
 *      manual step.
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
  async redirects() {
    return [
      {
        source: '/identity/profile-registry',
        destination: '/identity/address-link',
        permanent: true,
      },
      {
        source: '/contracts/profile-registry',
        destination: '/contracts/address-link',
        permanent: true,
      },
    ]
  },
})
