# Superhero Documentation

The documentation site for [Superhero](https://superhero.com) — the on-chain attention market
for social trends, built on the æternity blockchain.

Built with [Nextra](https://nextra.site) (docs theme, `pages/` router).

## Local development

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
```

> **Note on dependencies:** the Nextra versions are pinned to the `2.x` line, which is the
> line that supports this repository's `pages/` + `_meta.json` layout. `nextra@latest` now
> resolves to the 4.x line, which requires the App Router and a different meta format, so
> do not "upgrade" these specifiers without migrating the whole site first.
>
> `pnpm-lock.yaml` is committed and resolved against those pinned versions, so
> `pnpm install --frozen-lockfile` (the default on Vercel and most CI) works as-is.

### Deployment

Set `NEXT_PUBLIC_SITE_URL` to the site's real origin (for example
`https://docs.superhero.com`). It is used for `og:url` and for the absolute social-card image
URL; without it both fall back to a placeholder domain, which makes link previews wrong.

Brand assets live in `public/` and come from the Superhero app's own `public/` directory —
the mark, the wordmark, the favicon set and the social card.

### Two constraints worth knowing before you edit

1. **Never create `pages/api/`.** Next.js reserves it for API routes in the pages router,
   so MDX placed there builds as a serverless stub and returns HTTP 500 instead of
   rendering. The REST documentation lives at `pages/api-reference/` for this reason.
2. **Run the linter before you commit.** MDX failures are compile-time, not render-time,
   so a bad page breaks the whole build:

   ```bash
   python3 scripts/lint-mdx.py
   ```

   It checks frontmatter quoting, bare braces and JSX hazards, pipes inside table cells,
   broken internal links, and `_meta.json` drift. It exits non-zero on any finding.

## How this site is organised

```
pages/
├── index.mdx            Introduction
├── concepts/            What Superhero is, attention markets, architecture, glossary, FAQ
├── getting-started/     Quickstart, accounts, funding, first post, first trade, testnet
├── wallets/             Extension, mobile, web, built-in wallet, backup, security
├── identity/            SuperheroID, ProfileRegistry, names, X verification, DIDs
├── social/              Feed, posting, comments, tipping, hashtags, chat, moderation
├── tokens/              Bonding curves, token creation, trading, fees, portfolio, risks
├── dao/                 Community treasuries, proposals, voting, ProtocolDAO token
├── governance/          æternity governance polls, delegation, the registry
├── rewards/             Rewards program, affiliation, invite links, leaderboards
├── defi/                DEX swap, pools, wrapped AE, bridge, buying AE
├── agents/              AI agents: skill install, autonomous mode, strategies, CLI reference
├── api/                 api.superhero.com REST reference
├── contracts/           Sophia contract reference and deployed addresses
├── aeternity/           The underlying chain — scoped to what Superhero actually uses
├── resources/           Whitepaper, brand, support, legal, official links
└── contributing/        Authoring conventions and the documentation roadmap
```

## Current status

This site is a **briefed outline**. Every page carries:

- a **page brief** — one or two sentences saying what belongs on it,
- a `status` and `depth` marker,
- whatever content could already be sourced from the Superhero repositories,
- a **What this page still needs** list, and
- a **Sources to mine** list naming the exact files to read.

That structure exists so that each subsequent writing pass — human or agent — can pick a page,
read its sources, verify the facts, and replace the brief with finished content.

**Start at [`pages/contributing/how-to-contribute.mdx`](./pages/contributing/how-to-contribute.mdx)
before editing**, and use [`pages/contributing/roadmap.mdx`](./pages/contributing/roadmap.mdx)
as the work queue.

## Where the content comes from

| Source | What it provides |
| --- | --- |
| `superhero-com/superhero` | The web app: routes, features, `src/config.ts` endpoints and addresses, the FAQ copy in `server/lib/faq-content.cjs`, the landing copy in `src/locales/en.json`, and the full technical whitepaper in `src/views/Whitepaper.tsx` |
| `superhero-com/superhero-agent-skill` | The AI agent skill: `SKILL.md`, the task guides in `guides/`, the CLI scripts in `scripts/`, and the vendored contract ACIs in `contracts/` |
| `api.superhero.com` | The live REST API, inventoried in `superhero/docs/api-superhero-com-endpoints-and-fields.md` |

Facts in these docs should trace back to one of those. Do not write economic parameters,
addresses or endpoints from memory.

## License

MIT
