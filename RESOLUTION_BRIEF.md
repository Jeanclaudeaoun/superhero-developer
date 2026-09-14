# Open-question resolution brief

The docs are written. This pass **closes the `## Open questions`** that each page declares,
using source that was not available when the pages were drafted.

Read `AGENT_BRIEF.md` first for the house rules (no invented facts, MDX safety, voice,
`## Read more`). This file only covers what is new and what to do with it.

## What is newly available

Four repositories were cloned after the pages were written. Between them they answer most of
what the pages could not.

| Path | What it is | What it settles |
| --- | --- | --- |
| `/home/user/bcl-contracts/contracts/` | **All ten BCL Sophia sources** — `CommunityFactory`, `AffiliationBondingCurveTokenSale`, `BondingCurveExponential`, `DAO`, `DAOVote`, `CommunityManagement`, `AffiliationTreasury`, plus the three interfaces. Only 1,126 lines total — read them in full. | Every question of the form "settle it from the `.aes`": what a contract actually checks, requires, permits, burns, or gates. |
| `/home/user/superhero-com/superhero-api/` | **The backend.** NestJS. Note `src/api-core/guards/rate-limit.guard.ts`, `src/tokens/services/update-trending-tokens.service.ts`, `src/tokens/queues/update-trending-scores.queue.ts`, `src/plugins/address-links/` (including `aci/AddressLink.aci.json`), `src/configs/`, `src/plugins/bcl/contract/aci/`, `src/plugins/governance/contract/aci/`. | Rate limits, the trending-score formula, DTO shapes and units, auth, the ProfileRegistry successor, deployed addresses, whether an OpenAPI document is published. |
| `/home/user/aepp-governance/governance-contracts/contracts/` | `Poll.aes`, `Poll_Iris.aes`, `Registry.aes`, `Registry_Compiler_v6.aes`. | Whether `vote` is rejected after `close_height` on chain, whether `add_poll` is permissioned, how delegation and stake weighting actually work. |
| `/home/user/tipping-contract/contracts/v3/` | `Tipping_v3.aes` and `Tipping_v3_Getter.aes`. | Whether the deployed contract adds replay protection the whitepaper omits, the exact signed-message construction, and whether tip entrypoints exist. |

The original two repositories (`/home/user/superhero`, `/home/user/superhero-agent-skill`) are
still there and still authoritative for client behaviour.

## Still genuinely impossible

**Outbound HTTP is blocked** — the proxy returns 403 on CONNECT for every external host,
including `api.superhero.com`, `mainnet.aeternity.io` and `aescan.io`. `WebSearch` works;
`WebFetch` and `curl` do not.

So any question that can only be answered by *calling* something stays open. Do not guess a
live value. But note carefully: **many questions that were phrased as "call this endpoint" can
now be answered from the backend source instead** — if `superhero-api` computes the field, read
the code and document the formula rather than the observed value. That is a better answer
anyway, because it does not go stale.

Screenshots are also still impossible. Leave those requests alone.

## What to do to each `## Open questions` section

Work through every question on every page you own. For each one:

1. **Resolved** → delete the question, and fold the answer into the body of the page where a
   reader would actually look for it. Do not leave an answered question sitting in a list at
   the bottom. Cite the file and, where useful, the line — `bcl-contracts/contracts/DAO.aes`
   is the kind of citation that lets a reader re-check you.
2. **Partly resolved** → answer the part you can in the body, and rewrite the remaining
   question so it is narrower and states exactly what would close it.
3. **Still open** → keep it, but make sure it names what would settle it (a specific call, a
   specific person to ask, a specific unpublished document). Re-word anything vague.

If a page ends with no questions left, **delete the `## Open questions` heading entirely.**

## Corrections already confirmed — use these, do not re-derive

These were verified during this pass. Several contradict what the pages currently say.

**`get_sell_return_precision()` is a real bug, with a precise blast radius.** In
`BondingCurveExponential.aes`:

```sophia
entrypoint get_sell_return_percentage() = sell_return_percentage  // 9950
entrypoint get_sell_return_precision()  = sell_return_percentage  // returns 9950; should be sell_return_precision (10000)
```

The internal `calculate_sell_return` uses the **let-bound constants directly**, not the getters,
so **on-chain sell math is correct** (9950/10000 = 0.995). Only an off-chain caller that derives
the ratio from the two getters computes 1.0 and overestimates sell returns by 0.5%. Any page
that currently implies the sell math itself is broken must be corrected.

**The curve constants, read from source:**

```sophia
a = 10^15   k = 10^10   initial_price = 10^11   decimals = 10^18
minimum_count = 10^12   sell_return_percentage = 9950   sell_return_precision = 10000
curve_type() = "TAYLOR_EXPONENTIAL_V1"   supported_decimals() = 18
```

`minimum_count = 10^12` aettos is **10^-6 tokens** — the smallest tradable amount.

**The curve is a Taylor/Maclaurin expansion, not a true exponential.** `calculate_price` sums
`mc2()`, a Maclaurin expansion of `e^x` from the quadratic term, capped at 100 iterations. The
published closed-form figures were re-checked against an exact integer replica of the Sophia and
agree to within 2e-16 AE at supply 0 and 1.4e-12 AE at supply 10,000,000 — so the numbers on
`/tokens/bonding-curve` stand. But the pages should say the contract evaluates a bounded Taylor
series and that the closed form is the idealised curve it approximates.

## Verify before you finish

```bash
cd /home/user/superhero-developer && python3 scripts/lint-mdx.py
```

Must print `0 issues`. Deleting a question can orphan a link, so re-run it even for small edits.

Do not run any `git` command. Report which questions you closed, which you narrowed, and which
you left open and why.
