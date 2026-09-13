# Documentation authoring brief

You are writing production documentation for the Superhero docs site. Read this whole file
before you touch a page.

## Where things are

| Path | What it is |
| --- | --- |
| `/home/user/superhero-developer` | **The docs site you are editing.** Nextra 2, `pages/` + `_meta.json`. |
| `/home/user/superhero` | The Superhero web app. Your primary source of truth. |
| `/home/user/superhero-agent-skill` | The AI agent skill: `SKILL.md`, `guides/`, `scripts/`, `contracts/`. |

### The richest sources, in priority order

1. `/home/user/superhero/src/views/Whitepaper.tsx` — a full technical whitepaper is embedded
   in the `WHITEPAPER_CONTENT` template literal. Bonding curve math, fee splits, DAO rules,
   affiliation percentages, security model, glossary. **Read it.**
2. `/home/user/superhero/server/lib/faq-content.cjs` — 23 canonical FAQ entries.
3. `/home/user/superhero/src/config.ts` — every endpoint and contract address, both networks.
4. `/home/user/superhero/src/routes.tsx` — the authoritative route table for superhero.com.
5. `/home/user/superhero/src/locales/en.json` — all UI copy, including the landing page under
   `common.views.landing.*`.
6. `/home/user/superhero/docs/api-superhero-com-endpoints-and-fields.md` — REST inventory.
7. `/home/user/superhero-agent-skill/contracts/*.json` — contract ACIs (entrypoint signatures).
8. `/home/user/superhero-agent-skill/scripts/*.mjs` — read the `case` blocks for the real CLI
   surface; the guides are incomplete.

## Hard rules

1. **Never invent a fact.** Every number, address, endpoint, percentage, limit and entrypoint
   must trace to a file you actually read or a search result you actually saw. If you cannot
   verify something, put it under `## Open questions` on that page. A page with three honest
   open questions is worth far more than a page with three plausible fabrications.
2. **`WebFetch` is blocked by the network proxy.** It will fail for every external domain.
   Use **`WebSearch`** instead — it works and returns real content summaries plus URLs.
3. **Only link URLs you have evidence for.** That means: a URL that appeared in a `WebSearch`
   result, a `superhero.com` route you derived from `src/routes.tsx`, or a URL already present
   in the repositories. Do not guess documentation URLs.
4. **Do not run any `git` command.** Do not commit, branch, stage or push. The parent session
   handles all git.
5. **Stay in your assigned section.** Do not edit pages, `_meta.json` files, or config outside
   the directories you were given. Never edit `pages/_meta.json` (the root nav),
   `package.json`, `next.config.js`, `theme.config.tsx` or `README.md`.

## MDX safety — the build breaks if you get these wrong

The site is compiled with `next build`. These are the failure modes:

1. **Frontmatter must be double-quoted.** YAML reads an unquoted `: ` as a mapping.

   ```
   ---
   title: "How the Skill Works"
   description: "The anatomy of the agent skill: SKILL.md, guides, and scripts."
   ---
   ```

2. **No bare curly braces outside code.** MDX parses `{anything}` as a JavaScript expression.
   Wrap placeholders in backticks: write `` `{baseDir}` `` not a bare one.

3. **No bare `<` followed by a letter, `/` or `!` outside code.** MDX parses it as JSX. Write
   `` `<sale_address>` `` not a bare one.

4. **No `|` inside inline code inside a markdown table row** — it splits the cell. Use a
   fenced code block instead, or describe the alternation in prose.

5. **Do not `import` anything.** Plain MDX only. No Nextra components, no local components.

6. Math: use fenced ```text blocks. LaTeX is not enabled.

### Verify before you finish

```bash
cd /home/user/superhero-developer && python3 scripts/lint-mdx.py
```

It must print `0 issues`. Fix anything it reports. You may also run `pnpm build` (about 90
seconds) if you want full confidence — dependencies are already installed.

## What to do to each page

Each page currently looks like this:

```mdx
---
title: "..."
description: "..."
---

# Title

> **Page brief** — what this page must cover.
>
> `status: outline` · `depth: deep`

...any content that could already be sourced...

## What this page still needs
- gaps

## Sources to mine
- files to read
```

Turn it into this:

```mdx
---
title: "..."
description: "..."
---

# Title

One to three sentences of real opening prose that says what this page covers and who it is
for. The page brief blockquote is scaffolding — delete it.

...the actual documentation...

## Read more

- [Internal cross-link](/section/page) — why a reader would follow it
- [External canonical doc](https://verified-url) — what it adds

## Open questions
(only if something genuinely could not be verified)

- Precisely what is unknown, and where someone would look to settle it.
```

**Delete** the page brief blockquote, the `status`/`depth` line, and the "What this page still
needs" / "Sources to mine" sections. The brief told you what to write; once written, it is
noise. Anything from "still needs" that you genuinely could not resolve moves to
`## Open questions`, phrased as a specific question.

Keep and expand any content already on the page — it was sourced from the repositories and is
correct. Do not delete accurate tables to rewrite them from memory.

## Every page ends with `## Read more`

This is a requirement, not a suggestion. Each page needs:

- **2–5 internal cross-links** to other pages on this site, each with a short reason.
- **1–4 external links**, where they genuinely help. Good candidates:
  - The relevant æternity documentation page (find the exact URL with `WebSearch`).
  - The live superhero.com page where the reader can actually do the thing. Derive these from
    `src/routes.tsx` — for example token creation is at `https://superhero.com/trends/create`,
    trending tokens at `https://superhero.com/trends/tokens`, voting at
    `https://superhero.com/voting`, the DEX at `https://superhero.com/defi/swap`, the FAQ at
    `https://superhero.com/faq`, the whitepaper at `https://superhero.com/whitepaper`.
  - The GitHub repositories: `https://github.com/superhero-com/superhero-agent-skill`.

A how-to page should always link the place the reader can perform the action.

## Voice

- Second person, present tense, direct. "Open the token page and choose Buy."
- Lead with what the reader needs; put background after it.
- Prefer a table to a list when there are more than three parallel facts.
- Every code block must be runnable or clearly marked as illustrative.
- State risks plainly. Never oversell. This is documentation, not marketing copy.
- Do not describe the docs themselves ("in this section we will..."). Just document.

## Length

Aim for a genuinely complete page rather than a target word count. A `reference` page may be
mostly tables. A `deep` page should be the best available writing on its topic — typically
800–2000 words. Do not pad.
