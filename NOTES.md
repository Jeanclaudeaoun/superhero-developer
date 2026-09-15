# Maintainer notes

Not part of the published site. Material that belongs to the team rather than to readers:
product defects found while writing the docs, and facts that could not be verified against
a live system. Preserved here when they were removed from the pages.

## Defects in the products these docs describe

These are not documentation gaps. They are bugs, found by reading the source, and each is
documented in place so a reader is not misled. They are listed here so they are not lost.

| Defect | Where |
| --- | --- |
| The agent skill's entry thresholds (`> 100000`, `> 50000`, `> 20000`) can never fire — `trending_score` is bounded to `[0,1]`. | [Strategies](/agents/strategies) |
| `AffiliationTreasury.record_sale_transaction` is unpermissioned and accepts a caller-chosen value that advances the anti-sybil counter. | [AffiliationTreasury](/contracts/affiliation-treasury) |
| `get_sell_return_precision()` returns the percentage constant, so an off-chain caller deriving the ratio gets 1.0 instead of 0.995. | [Bonding curve contract](/contracts/bonding-curve) |
| The in-app bonding-curve graph plots an offset 1000× the deployed constant, and its explainer describes a quadratic curve. | [Bonding curves](/tokens/bonding-curve) |
| The DAO vote-type selector is not wired to the submitted subject — every proposal opens as a payout. | [Proposals](/dao/proposals) |
| `token-created` and `token-transaction` are listened for but never emitted. | [WebSocket](/api-reference/websocket) |
| The DEX `tvl` key sorts by all-time volume; `valueUsd` is never assigned, so Pool's Total Value always reads 0. | [Explore](/defi/explore), [Pools](/defi/pools) |
| The WebAuthn PRF challenge is not bound to the payload hash, contrary to what `inline-signer.ts` requires of itself. | [Built-in wallet](/wallets/built-in-wallet) |
| Superhero maps `ok_` to an æScan route that does not exist. | [Explorers](/aeternity/explorers) |
| Governance `revoke_vote` is ungated, so a closed poll's result can still shrink. | [Voting](/governance/voting) |
| The agent skill's governance guide computes close heights at 3s per key-block; they are ~3 minutes. | [Create a poll](/governance/create-a-poll) |
| `superhero-invite.mjs` initialises the treasury with the factory ACI, so `register_invitation_code` is not on the object. | [CLI reference](/agents/cli-reference) |

## Unverified facts, by page

Each entry names what would settle it.

### identity/chain-names

- **Where does a Superhero user bid on a short name?** Names of 12 characters or fewer go to a
  first-price auction whose duration and starting bid scale with name length, with each bid at
  least 5% above the last. Neither the web app nor `superhero-name.mjs` implements bidding — the
  script refuses the name outright. Use a wallet or CLI that supports `NameClaimTx` bidding;
  whether Superhero intends to add it is a question for them.
- **What are the current per-length auction durations?** They are protocol parameters that have
  changed across hardforks and are recorded in no Superhero source. Read them from the
  [AENS protocol specification](https://github.com/aeternity/protocol/blob/master/AENS.md) for
  the protocol version the network is running.
- **Pointing a name at a contract.** AENS pointers are a key-value map and support more than
  `account_pubkey`, but the Superhero CLI only ever sets that one key, and no Superhero surface
  reads any other. A `ct_…` pointer would be invisible to every surface documented here.

### identity/did-standard

- **Is there a DID method name, and was `link_did` built for a specific one?** No `did:` string,
  method specification or resolver appears in the web app, the backend or the agent skill, yet
  `AddressLink` carries a complete DID-keyed namespace nobody calls. Ask Superhero what that
  namespace was designed for, and whether a method is registered or intended for registration
  in the DID Specification Registries.
- **Is a DID document served anywhere?** No endpoint in `superhero-api` returns one, no
  `.well-known` route exists in `superhero/server`, and `get_links_did` returns a link map
  rather than a document. Nothing would produce one today.
- **What does "W3C standard compliant" mean here operationally?** Until a method exists, the
  claim cannot be tested against the DID Core conformance criteria. Anyone relying on it for an
  integration should ask for the method specification first — and, given the X regression
  above, should ask specifically which claims are meant to be independently verifiable.

### identity/names

- **Can two addresses link the same provider value?** The contract keeps a `reverse` map from
  `(provider, value)` to address, which suggests one owner per value, and the backend surfaces
  an `ALREADY_CLAIMED` abort described as "this provider is already linked to a different value
  for this address" — which is the *other* direction. Whether a second address linking an
  already-claimed value overwrites, aborts, or silently coexists needs the `AddressLink.aes`
  source; only the ACI is vendored.
- **Is there a length or character limit on a linked name beyond the contract's own?** The
  contract caps any value at 200 characters and forbids `:`. No shorter limit appears in the
  backend for `prefaens` or `x`. AENS names carry their own protocol rules — see
  [Chain Names (AENS)](/identity/chain-names).

### identity/profile-registry

- **Where is `AddressLink` deployed?** The mainnet and testnet `ct_…` addresses live only in
  `ADDRESS_LINK_CONTRACT_ADDRESS` in the deployment environment. Neither `superhero/src/config.ts`
  nor the backend repository carries a default. Ask Superhero, or read the contract id from any
  `link` transaction the API has relayed.
- **Where is the `AddressLink.aes` source?** Only the ACI is vendored. Access-control details
  the ACI cannot express — whether `register_provider` is open to anyone or restricted, whether
  `ALREADY_CLAIMED` blocks relinking to the same value, how `reverse` handles two addresses
  claiming one value — need the Sophia source. Ask for the contracts repository that holds it.
- **Is `ProfileRegistry` still deployed and holding state?** The backend stopped reading it, but
  nothing says it was destroyed. If it is still on chain, names registered in it are still in
  its state tree and simply have no consumer. Settle it by asking for the registry's address.

### identity/x-verification

- **Which account owns the `x` provider on mainnet?** It is the wallet behind
  `ADDRESS_LINK_SECRET_KEY`, which is deployment configuration and is published nowhere. It is
  readable from chain as `AddressLink.get_provider_owner("x")` once you have the contract
  address — which is itself unpublished; see
  [The AddressLink contract](/identity/profile-registry).
- **Is there a published OpenAPI document to check any of this against?** `main.ts` mounts
  Swagger at `/api` only when the process is **not** in production, or when an operator sets
  `ENABLE_SWAGGER=true`. So there is no guaranteed public schema on the production API; the
  DTO classes in `superhero-api/src/plugins/address-links/dto/` and
  `docs/address-links/frontend-guide.md` are the reference.

### agents/autonomous-mode

- The skill defines no config file format or location for the strategy JSON. `SKILL.md` and
  `guides/autonomous.md` show the JSON and refer to "the config", but the only files any
  script reads from disk are the contract ACIs under `contracts/` — no script opens a config
  file, and no path is specified. In practice the strategy is instruction text the runtime
  persists, which means a runtime that loses conversation state loses the strategy. Nothing
  in the repository can settle this; it is a per-runtime answer, so confirm how yours persists
  instructions before relying on autonomous mode across restarts.
- There is no scripted kill switch. A `pause` or `panic-sell` command in the skill would make
  the "sell all positions" override mechanical rather than conversational; none exists in the
  [repository](https://github.com/superhero-com/superhero-agent-skill) today. A new script or
  a `case` block in `superhero-token-swap.mjs` would settle it.

### agents/cli-reference

- The `superhero-invite.mjs` ACI defect above is established from the file layout and from
  how every other script in the skill loads its ACI, but the exact runtime symptom — which
  error the SDK raises when the method is absent — has not been observed. Run
  `node scripts/superhero-invite.mjs generate 0.01 1` against a funded wallet to see it, and
  report the wording to the
  [skill repository](https://github.com/superhero-com/superhero-agent-skill).

### agents/governance

- **Does the governance server recognise a poll by bytecode hash, and if so which hashes does
  it accept?** The skill deploys `Poll_Iris.aes` built with aesophia 7.0.1; Superhero's
  backend records an 8.0.0 build of the same source under a different hash. If the server
  filters on hash, polls created by the skill get `stake_weighted_results: null` forever and
  the fix is to rebuild `contracts/PollBytecode.json` with the matching compiler. Settling
  this needs the `aepp-governance` backend's own indexing rules — it is a different service
  from `superhero-api`, and neither its source nor its behaviour is in these repositories.

### agents/openclaw

- **From which OpenClaw version does `primaryEnv` actually prompt?** The fields are part of
  ClawHub's current documented skill format, but the release that began honouring them for
  interactive prompting is not recorded in the skill or in ClawHub's format documentation.
  OpenClaw's own changelog or release notes would settle it. Until you have checked, assume
  nothing prompts and set `AE_PRIVATE_KEY` yourself before the first run.

### agents/other-runtimes

- No MCP wrapper for these scripts is published in the Superhero organisation. The design
  above is a recommendation, not a description of existing code — if one ships, it will be in
  the [skill repository](https://github.com/superhero-com/superhero-agent-skill).
- Only `superhero-governance.mjs` honours an `AE_NODE_URL` override; the eight other scripts
  that reach a node hard-code `https://mainnet.aeternity.io`, and the six that reach the REST
  API hard-code `https://api.superhero.com`. Running the skill against testnet would need a
  patch in both places, so there is currently no safe rehearsal environment — even though the
  backend itself is network-aware and ships testnet addresses for the factory, the
  affiliation treasury and the governance registry. Two environment variables,
  `AE_NODE_URL` and an `AE_API_BASE`, applied consistently across the scripts, would close
  this; watch the
  [skill repository](https://github.com/superhero-com/superhero-agent-skill) for them. See
  [Testnet](/getting-started/testnet) for what testing on æternity normally looks like.

### agents/safety

- There is no scripted kill switch — no `pause`, no `panic-sell`. Stopping an agent means
  stopping its scheduler or removing its permissions, both of which live outside the skill.
  What would settle this is a new `case` block in `superhero-token-swap.mjs` that reads the
  portfolio and sells every position in one invocation; nothing in the
  [skill repository](https://github.com/superhero-com/superhero-agent-skill) does that today.
  Until then, write your own wrapper around `superhero-portfolio.mjs summary` and
  `superhero-token-swap.mjs sell`, and test it before you need it.
- Only `superhero-governance.mjs` honours an `AE_NODE_URL` override, and every script that
  calls the REST API hard-codes `https://api.superhero.com`, so there is no supported way to
  rehearse the trading loop against testnet. Every test is a live mainnet transaction. The
  backend is network-aware and testnet addresses exist for the factory, the affiliation
  treasury and the governance registry, so this is a gap in the skill rather than in the
  platform. See [Testnet](/getting-started/testnet).

### agents/strategies

- `max_hold_cycles` requires the agent to know which cycle a position was opened in, and
  nothing in the skill persists that. How each runtime carries the count across scheduled runs
  is undefined. See [Autonomous Mode](/agents/autonomous-mode).

### agents/trading

- The skill provides no way to place a limit order or a stop. Every exit is a market sell
  executed at whatever the curve offers when the cycle happens to run, which means a sharp
  decline between cycles is not caught by `sell_on_price_drop_percent` until the next cycle.

### agents/wallet-and-keys

- The skill provides no command to send plain AE from one address to another, and no command
  to transfer an AEX-9 token balance, even though the bundled `FungibleTokenFull` ACI declares
  a `transfer` entrypoint and `superhero-token-swap.mjs` already initialises the token contract
  against it. Rotation therefore requires a second tool. What would close this is a `send`
  case in `superhero-wallet.mjs` and a `transfer` case in `superhero-token-swap.mjs`; neither
  exists in the
  [repository](https://github.com/superhero-com/superhero-agent-skill) today, and no issue or
  roadmap entry in it says whether they are planned.
- Whether `extendTtl()` in the SDK version the skill pins (`@aeternity/aepp-sdk ^14.1.0`)
  still defaults to the 180,000-generation maximum was taken from the SDK's transaction-options
  documentation, not read from the installed package. Confirm by running
  `superhero-name.mjs extend` once and reading the resulting name object's `ttl` against the
  current top block height, or check
  [transaction options](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/transaction-options.md)
  for the version you actually have.

### dao/moderators

- **Whether a muted member is actively removed from the relay, or only blocked from re-joining.** The backend refuses to re-add a muted member and marks them ineligible, and eligibility flips normally drive a `pending_remove` transition — but whether an already-published member is removed promptly on being muted, or lingers until the next membership sync, was not traced here. `membership-sync.service.ts` and the `tgr.eligibility.changed` consumer in `superhero-api/src/token-gated-rooms/` would settle it.

### dao/overview

- **No mainnet proposal has been walked end to end with transaction hashes on this page.** To
  produce one, list a community's votes with `DAO.votes()` for a sale address taken from
  `/trends/daos`, then look up the `add_vote`, `vote` and `apply_vote_subject` transactions for that
  vote contract on [æScan](https://aescan.io). A worked example would be worth more than any of the
  prose above.

### dao/protocol-dao

- **Whether it is traded anywhere.** It does not appear in the Superhero DEX configuration and
  is not a bonding-curve token, so there is no protocol-native market for it. Whether a DEX
  pair exists would have to be checked against the live DEX factory.
- **The governance roadmap.** No design document, specification or timeline for the ProtocolDAO
  appears in the repositories — only the whitepaper's and the contract README's statements of
  intent. This page should be updated when one is published.

### dao/replaceable-dao

- **No community appears to have migrated its DAO on mainnet, and none has been verified here.** A worked example would need a `ChangeDAO` vote observed at `/trends/daos`, or an `AppliedVoteSubject` event carrying a `ChangeDAO` subject on a DAO contract, found through [æScan](https://aescan.io). Everything above is read from `bcl-contracts/contracts/DAO.aes` rather than from an executed migration.
- **No reference implementation or template for a custom `ReplaceableDAO` is published.** The contract repository ships only the interface and the stock `DAO.aes`; there is nothing in the agent skill either. If one appears, it would be the right starting point in place of the outline above.

### social/chat

- **What is the relationship between the Quali.chat partnership and the Nostr relay?** The FAQ
  attributes chat to Quali.chat while the in-app client is pure Nostr against
  `wss://relay.superhero.chat`, and the Quali surfaces are Matrix rooms on a different host.
  Whether Quali.chat operates the Nostr relay, or the two are independent products marketed
  together, is stated nowhere in the four repositories — ask Superhero who runs
  `relay.superhero.chat`.
- **Is the Quali.chat CSP omission intentional?** The preview cannot load as deployed, yet
  `quali.chat` and `app.quali.chat` were deliberately classified as navigation-only in the
  build check. Whether the preview is considered retired or the omission is a bug is a question
  for whoever owns `server/lib/csp.cjs`.
- **Is NIP-04 still the intended DM scheme?** The client uses NIP-04 throughout; the wider
  Nostr ecosystem has newer encrypted-DM proposals. Nothing in the repositories states a
  migration plan.

### social/comments

- **Is `comment/` as a separator ever actually on chain?** The client's parser accepts it and
  the indexer does not, so a post using it would render as a reply in the app and as a
  top-level post in the API. No writer in any of the four repositories emits it. Scanning
  `post_without_tip` call arguments on the mainnet contract for the literal `comment/` would
  settle whether the client's tolerance is defensive or historical.

### social/feed

- **Is there a live post channel?** No. The API socket emits only `token-updated` and
  `token-history`, and `superhero-api` exposes a separate `/notifications` namespace for the
  bell. Neither carries new posts, and nothing in the client or the backend implements one.
  Whether one is planned is a question for Superhero.

### social/hashtags-and-topics

- **Which provider actually pushes the trending index on mainnet?** The ingest endpoint stores
  whatever `provider` string the caller sends, and the entity's own comment lists `x`,
  `facebook` and `github` as examples. Which of those is live, on what cadence, and how that
  provider derives its scores, is outside both repositories — ask Superhero, or read the
  `source` values on a live `GET /api/trending-tags` response.

### social/moderation

- **Is any account other than a community creator ever seeded as a moderator?** The factory
  seeds exactly one, and `add_moderator` requires the owner — which is the DAO — so every
  subsequent moderator costs a two-week vote and 555 AE. Whether Superhero operates a
  standing moderator account on communities it creates is not visible in either repository;
  reading `moderator_accounts()` on a few live `CommunityManagement` contracts would settle it.
- **Does anything consume the `MuteUserId` / `AddModerator` events directly?** The backend
  re-reads `get_state()` rather than following events, so the typed events in
  `CommunityManagement.aes` have no consumer in these repositories. Whether an external
  moderation tool subscribes to them is a question for Superhero.

### social/notifications

- **How is an `announcement` authored?** The type exists with a `superhero-api/src/announcements`
  module behind it, but the authoring surface is an operator tool rather than anything in the
  public API or either client. Ask Superhero who can publish one.

### wallets/built-in-wallet

Two facts that used to be open are now settled in the body above: the PRF challenge is random
rather than payload-bound, and the cached chat identity's idle window is 30 minutes. What remains is
a roadmap question.
- **Is a user-verification-gated phrase reveal planned, or merely wished for?** That there is no
  reveal today is certain — three separate modules say so in comments
  (`wallet-lifecycle.ts`: "there is no reveal or … copy. A UV-gated phrase reveal is the fix; until
  it exists, do not describe the passkey as a backup"; `passkey-seed.ts`: "there is no export/reveal
  screen today"; `WalletOnboarding.tsx`: "There is no reveal screen"), and no component implements
  one. What is not established is whether it is scheduled: no repository contains a roadmap, an
  issue reference or a design note beyond those comments. Superhero would have to say — and until
  they do, a device-bound passkey remains the single copy of a passkey-created seed.

### wallets/security

- **Does Superhero publish a dedicated security address, an expected response time, or a bounty?**
  No. Seven repositories were checked — the web app, `superhero-api`, `superhero-wallet`, the agent
  skill, `bcl-contracts`, `tipping-contract` and `aepp-governance` — and none contains a
  `SECURITY.md`, a `security.txt`, a dedicated address or a bounty programme. The wallet's README
  asks you to "get in touch with us" and stops there; the only address anywhere is the general
  contact mailbox listed above. Closing this means Superhero publishing a `SECURITY.md` naming an
  address and a disclosure timeline. Until then, use the email and see
  [Support](/resources/support).
- **Will the BCL contracts be audited?** The headers say they have not been, and no report exists in
  any repository. A published audit naming a firm, a date and a commit hash would close this;
  nothing weaker should. Ask on
  [the issue tracker](https://github.com/superhero-com/superhero/issues).

### wallets/superhero-wallet-extension

- **Is a given Chrome listing and Firefox listing at the same version right now?** Structurally they
  should be: both come from one CI job and take their version from `package.json`, so one tag is one
  version number. But store review happens in two separate queues and nothing in the repository
  automates submission, so they can sit apart for days. This is not answerable from a docs page —
  it would be stale on publication. Compare **More → About** in your two installs, or the two store
  listings, against the latest tag in
  [superhero-com/superhero-wallet](https://github.com/superhero-com/superhero-wallet/releases).

### wallets/superhero-wallet-mobile

- **Which iOS Safari control is current for Add to Home Screen?** The app ships two contradictory
  versions of this copy — the landing-page prompt says "Tap the Share button", the install guide says
  "Tap the three-dot menu (⋯)" — and both live in `src/locales/en.json`, so the repository cannot
  adjudicate between them. This needs one test on a current iOS Safari, after which the losing string
  should be fixed in the app rather than worked around here.
- **Does the "Superhero — Web3 Communities" store app differ from the installed superhero.com PWA?**
  This half of the question is still open, and now for a specific reason: `/home/user/superhero`, the
  web app's repository, contains **no native project at all** — no `capacitor.config.*`, no
  `android/` or `ios/` directory, no Cordova or React Native configuration. Its surface-gated
  behaviours key on *installed versus browser tab*, not on native versus PWA. So whatever the store
  builds wrap, they are produced from a source that is not in any available repository, and only
  Superhero can say what it contains. (The *standalone* half of this question is settled above: the
  Superhero Wallet native apps and the installed web wallet genuinely differ, and the table says
  how.) A screenshot-based walkthrough of native onboarding is still wanted for this page.

### wallets/troubleshooting

- **What is the full list of "official channels listed in the app"?** The table above is what seven
  repositories yield, and `superhero-wallet` added three of its rows — the typeform, the contact
  mailbox and the three chat hosts. What is still missing is a first-party page that *declares* the
  list, so a reader can tell a channel that was retired from one that never existed. Only Superhero
  can publish that — see the same question on [Support](/resources/support), where this page's
  answer is kept in step.
- **Is there a workaround for the Apple passkey-rekey defect beyond the recovery code?** `recovery.ts`
  cites the radar number as the motivation for the recovery-code factor existing at all, but
  describes no path back to a rekeyed credential. Since Superhero cannot fix a platform
  authenticator, closing this needs either an Apple fix or a WebAuthn-level re-enrollment flow that
  the app does not have today — and note that the app has no factor-removal UI either, so a dead
  passkey factor cannot even be cleared. Enroll the recovery code; that is the answer that exists.

### governance/polls

- **Which build the deployed mainnet backend actually recognises.** The hash table documented above
  is the one in the checked-out `aepp-governance` repository; the running service could be on an
  older revision with a shorter table. If a poll you created reports `stake_weighted_results` as
  `null` despite using an unmodified source, this is the first thing to check — and the only way to
  check it is to try.
- **How ties between options are broken.** `stakesForOption` sorts votes within an option but
  imposes no ordering between options with equal stake, and nothing in the contracts or the backend
  declares a winner at all. A tied poll has no documented resolution because the system does not
  pick winners — it reports stake per option and leaves the decision to people.

### governance/registry

- **Which registry version each deployed address is running.** Both sources are in the repository and their ACIs are identical, so the only way to tell is to call `version()` against the mainnet and testnet addresses — `1` for `Registry.aes`, `2` for `Registry_Compiler_v6.aes`. It changes nothing about how you call them; it matters only if you are reproducing a deployment.
- **Whether the mainnet registry is reachable through the public `https://mainnet.aeternity.io` node.** The app's mainnet configuration uses a third-party node host while the agent skill's CLI defaults to the public one. Settle it with one call: set `AE_NODE_URL=https://mainnet.aeternity.io` and read `version()` off `ct_ouZib4wT9cNwgRA1pxgA63XEUd8eQRrG8PcePDEYogBc1VYTq`. If the CLI times out against mainnet, this is the thing to check first.

### rewards/rewards-program

- **Which countries are blacklisted?** The disclaimer says users from blacklisted countries
  are not eligible, but there is no geographic check anywhere in the reward code — searching
  `superhero-api/src/` for country, geo, blacklist or `cf-ipcountry` turns up nothing outside
  a comment about reverse proxies. So it is not an application rule that a reader could look
  up; it is either enforced at the edge or applied manually when payouts are reviewed. Only
  Superhero's operators can publish the list.

### concepts/architecture

- **Who operates `mdw.wordcraft.fun`, and under what commitment?** The backend's own deployment
  guide (`superhero-api/scripts/GUIDE.md`) pulls mainnet database backups from
  `root@dev.wordcraft.fun`, and the API's package name (`wordcraft-api`) and Swagger title
  ("WORD CRAFT Scan") share the brand — so the domain is almost certainly run by the same team
  rather than by a third party. What is not established anywhere is the availability commitment:
  no SLA, rate limit or maintenance policy for that host appears in any repository. Ask Superhero,
  or compare `GET /v3/status` against `mainnet.aeternity.io` to see whether it tracks upstream
  releases.

### concepts/faq

- **Which countries are excluded from the rewards programme?** Question 15 states the restriction.
  The list is not in the web app, the agent skill or `superhero-api` — the backend has no country,
  geo-IP or jurisdiction check anywhere in `src/`, so the restriction is enforced by policy rather
  than by code. The list must come from Superhero, or from the rewards terms shown on the rewards
  page in the live app.
- **Is the rate limit the same in production as in the source?** `RateLimitGuard` hard-codes 10
  requests per minute with no environment override, so the deployed figure should match — but the
  guard is per-process and the number of replicas behind `api.superhero.com` is not public, so the
  limit you actually hit may be a multiple of it. Observing 429 responses against the live host
  settles it: send requests to `api.superhero.com` faster than ten per minute and count how many
  land before the first 429.

### concepts/on-chain-social

- **What is the real gas cost of a post?** The 0.00001 AE figure comes from the agent skill's
  guides, not from a measurement or a fee schedule, and no contract determines it — the cost depends
  on the deployed bytecode and the gas price at execution. Closing this means publishing posts of
  several lengths on mainnet and reading `gasUsed` and `gasPrice` off each transaction in an
  explorer.

### concepts/value-flow

- **What are the real gas costs of a buy, a sell and a token creation?** No repository states one,
  and the contracts do not determine it — gas depends on the deployed bytecode and the network's gas
  price at execution. Each is visible as the transaction fee on an individual transaction in
  [æScan](https://aescan.io); closing this means submitting one of each on mainnet and recording
  `gasUsed` and `gasPrice` against a known block height.

### api-reference/conventions

- **Is there a published deprecation or breaking-change policy?** The code shows the mechanism
  (annotate, keep accepting, stop acting) but no source in any repository states a support
  window, a notice period or a changelog location. Only the API operators can answer that.
- **What are the operational limits in front of the app?** The application-level rate limiter
  documented above is the only one in the source. Whether the deployment sits behind a CDN or
  reverse proxy that adds its own throttling, request-size limits or connection caps is not
  determinable from the repository — ask the operators before running a high-volume poller.

### api-reference/dex

- **Is `dex-backend-mainnet.prd.service.aepps.com` still running?** The Superhero side of the
  question is settled — nothing calls it, and the API replicates its two contracts under
  `/api/dex/*`, with the source calling it "legacy". Whether the host itself is still serving is a
  question for its operators at æternity, not something either repository records. A single
  request answers it: `curl -sI https://dex-backend-mainnet.prd.service.aepps.com/`.

### api-reference/factory-and-contracts

- **How is a factory upgrade actually rolled out?** The API can only ever name one factory per
  network — `BCL_FACTORY` is a single record keyed by network id, and `getCurrentFactory()` caches
  it for the process lifetime — so during a transition `/api/factory` returns the old address
  until the backend is redeployed and restarted, with no overlap and no notice. Whether the old
  factory keeps accepting `create_community` calls in the meantime is a question for the contract
  operators, not something the API records.

### api-reference/index

- **Is Swagger enabled on `api.superhero.com` itself?** The code says it is mounted at `/api` and
  `/api-json` outside production, or in production when `ENABLE_SWAGGER=true`. Which of those the
  live mainnet deployment is running is an operator setting, not a source fact. A request to
  `https://api.superhero.com/api-json` settles it in one call.
- **Is there a published support or deprecation window?** Retired parameters are annotated and
  silently stop having an effect (see
  [Conventions](/api-reference/conventions#versioning-and-deprecation)), but no notice period,
  changelog location or removal schedule is recorded anywhere in the source.

### api-reference/invitations-and-affiliations

- **Is `POST /api/affiliations` meant to be publicly writable?** It is, today: no guard, no
  signature, no rate limit, and `sender_address` is stored without verification, so anyone can
  create a pool naming any address. Nothing in the source says whether that is deliberate for a
  campaign tool or an oversight. Only the API operators can say whether it is protected at the
  edge or should be treated as a private endpoint.

### api-reference/node-and-middleware

- **Who operates `mdw.wordcraft.fun`, and what are its uptime and rate-limit guarantees?** The
  layout makes it unambiguously an æternity node plus middleware, and the CSP makes it the only
  host a Superhero browser page can reach. But it appears in no backend source at all — the API
  server indexes from `mainnet.aeternity.io` — so no repository documents its operator, its SLA or
  its throttling. Ask whoever runs the Superhero deployment; there is nothing further to read.
- **Is `mainnet.aeternity.io` deliberately excluded from the browser CSP?** The testnet host is on
  the allowlist and the mainnet one is not, while the web app's `src/config.ts` points mainnet at
  `mdw.wordcraft.fun` — so the allowlist is at least consistent with that configuration, and the
  backend's use of the public host is server-side and unaffected by CSP. Whether a browser fallback
  was ever intended is not recorded; the `server/lib/csp.cjs` change history would show it.
- **Which middleware version is deployed at each host?** The middleware's API has changed across
  major versions — the web app calls `/v2/` and `/v3/` paths and the backend subscribes to a
  `/mdw/v2/websocket` — and nothing in any repository pins or records a version. The middleware's
  own `GET /mdw/v3/status` reports its version and its distance from the chain tip; that call
  answers this and the upstream-lag question together.

### api-reference/profile

- **Where is the `AddressLink` contract deployed?** Every write on this page ends in a call to it,
  but its address comes from the `ADDRESS_LINK_CONTRACT_ADDRESS` environment variable with no
  default in the source — an unset variable disables the whole plugin. The deployed value is in a
  running deployment's environment, or in its first log line; it is not in any repository. See
  [Profile registry](/contracts/profile-registry).

### api-reference/trending

- **Which providers hold a `TRENDING_TAGS_API_KEY` in production?** The backend imposes no
  allow-list on `provider` and pulls nothing itself, so the `source` values in the live table are
  whatever the key-holders send. Only the API operators know who holds a key; the values in the
  Swagger example (`x`, `facebook`, `github`) are illustrative. Reading `GET /api/trending-tags`
  and collecting the distinct `source` values shows who posted most recently, but because ingest
  truncates the table that is one provider at a time, not the full set.

### api-reference/websocket

- **Is the deployed API more than one container, and does it run a Socket.IO Redis adapter?** The
  gateways' own comments flag this as the case where an emit reaches only the clients connected to
  the instance that produced it, and the connection and handshake caps are both documented in the
  source as "single-container deploy" in-memory counters. Nothing in the repository says how
  `api.superhero.com` is actually deployed. Only the API operators can answer it. If the answer is
  "several replicas, no adapter", the at-most-once advice above becomes considerably more than a
  formality.

### contributing/how-to-contribute

- Who reviews and merges is not established. The repository has no `CODEOWNERS`, no
  `.github/workflows`, and no PR template. Until that is settled, treat the checklist above as
  self-review.
- There is no automated check in CI, so nothing prevents a page with broken MDX from being
  merged. A workflow running `scripts/lint-mdx.py` and `pnpm build` on pull requests would close
  that gap.

### getting-started/claim-name

Half of what used to be here is answered above: **Superhero Wallet does warn you and can auto-extend**
(a 17,000-block window), while superhero.com and `superhero-api` do neither — there is no expiry job
anywhere in the backend. What is left is the protocol constant and the lapse behaviour.
- **What is a name's default TTL in blocks?** Still a protocol question, and the wallet does not
  settle it: it lets the SDK choose the TTL when extending (`extendTtl(undefined, …)`), and the
  literal `nameTtl: 50000` in `getNameExtendFee` is a dummy value used only to build a throwaway
  transaction for fee estimation. The authoritative figure is in
  [AENS.md](https://github.com/aeternity/protocol/blob/master/AENS.md) and in the SDK's own default.
- **What happens to a lapsed name's pointer, and to a profile using it as its display source?** The
  protocol side (whether pointers are cleared, and whether the name re-enters auction) is in AENS.md.
  The Superhero side — whether a profile silently falls back to the address or keeps showing a dead
  name — is not determinable from the repositories and would need a lapsed name to observe.

### getting-started/create-account

Three things that were open are now settled, and all three are worth knowing before you choose a
path. **A passkey-created wallet's phrase cannot be revealed anywhere** — three modules in
`src/features/wallet/` say so in comments and no component implements a reveal, so if you create
with a passkey, that passkey is your only backup and it must sync. **The built-in wallet's
passphrase cannot be changed later** — there is no `addPassphraseFactor` and nothing calls
`removeFactor`, so changing it means recreating the vault from the phrase. And **the standalone
Superhero Wallet's backup step is optional and comes after onboarding**, documented above. See
[The Built-In Wallet](/wallets/built-in-wallet) and
[Backup & Recovery](/wallets/backup-and-recovery).
- **Is a phrase reveal actually planned?** The code names a user-verification-gated reveal as "the
  fix", and the standalone Superhero Wallet already ships exactly that shape of screen — a
  re-authentication gate in front of the phrase — so the design is not the obstacle. What is missing
  is any statement of intent: no repository carries a roadmap, an issue reference or a design note
  beyond those source comments. Only Superhero can say whether it is scheduled.

### getting-started/first-post

- **Is there a limit on the number of media entries in one post?** File size is not a question —
  nothing is uploaded, so a "size limit" has no place to live; the media list is a list of URL
  strings. No count cap exists anywhere in the path: not in `PostForm.tsx`, not in the contract
  (which takes an unbounded `list(string)`), and not in the indexer — `superhero-api` stores
  `media` as a plain JSON column defaulting to `[]` with no length validator
  (`src/social/entities/post.entity.ts`). So the practical ceiling is gas and whatever the pickers
  let you accumulate. Adding many entries to a post on testnet and watching where it stops would
  turn that into a number.
- A screenshot of the composer with each control labelled would make this page easier to follow.
  None exists in the repositories; capturing one against the live app is a follow-up.

### getting-started/first-trade

- An annotated screenshot of the trade card, with every field labelled, is wanted here. None exists
  in the repositories.

### getting-started/fund-wallet

- **Are the `/defi/bridge` and `/defi/buy-ae-with-eth` routes disabled temporarily or permanently?**
  The router keeps both the redirect and the commented-out view, which reads as "re-enable later",
  but nothing states the intent — and neither of the other two codebases resolves it. `superhero-api`
  has no bridge or on-ramp module at all, only the aeETH token address the DEX needs to price the
  pair; `superhero-wallet` keeps its own on-ramp (Simplex) behind an `UNFINISHED_FEATURES` flag that
  production builds set to `false`, which is consistent with "parked" but is evidence about a
  different product. Only a maintainer can say; ask on
  [the issue tracker](https://github.com/superhero-com/superhero/issues). See
  [Bridging from Ethereum](/defi/bridge).
- **Which exchanges besides Gate.io support AE withdrawal to a native `ak_` address?** The app links
  Gate.io plus three swap aggregators and nothing more; no list of withdrawal-capable exchanges
  exists in any repository, and it would go stale the moment it was written. Check the specific
  exchange's own withdrawal page for the æternity network before depositing, and test with a small
  amount.
- **What does a full first-post-plus-first-trade path actually cost, end to end?** The 0.01 AE floor
  above is a working answer, not a measurement. Capturing the real figure means running both actions
  on mainnet and summing the fees and gas off the two transactions.

### getting-started/navigating-the-app

- A screenshot per major section would make this page substantially easier to use. None is included
  here because none exists in the repository; capturing them against the live app is a follow-up.
- **Do the "Superhero — Web3 Communities" store apps use the same route paths as superhero.com?**
  The web routes in `src/routes.tsx` are authoritative for superhero.com, and the reason no
  repository describes the native apps' navigation is now specific: `/home/user/superhero` contains
  **no native project at all** — no Capacitor config, no `android/` or `ios/` directory, no Cordova
  or React Native setup — so the store builds are produced from a source not in any available
  repository. Nothing in the web app distinguishes native from PWA either; its surface-gated
  behaviours key on *installed versus browser tab*. Someone with the native app installed would have
  to compare, or Superhero would have to publish that source.

  For the avoidance of confusion: the **standalone Superhero Wallet** app is a different program with
  a different, self-contained route table of its own (`superhero-wallet/src/popup/router/routes.ts`,
  hash-routed on the extension and mobile builds). None of the paths on this page apply to it.

### getting-started/testnet

- **What is the faucet's grant per request?** Published figures disagree — 5 AE and 250 AE both
  appear for different æternity faucet deployments — and the amount is a configuration value, not a
  protocol constant, so any number written here would be a guess about someone's deployment. The
  rate limit *shape* is settled (a per-address graylist, signalled by HTTP 425), but not its
  duration. Both close in one request: `POST https://faucet.aepps.com/account/<address>` and read
  the response, then repeat it and read the graylist message.
- **Is a public testnet deployment of the Superhero *social* front end hosted anywhere?** See above
  — the testnet backend is evidently operated, and the hosted wallet at `wallet.superhero.com`
  reaches testnet from its own settings, but no testnet origin for superhero.com itself exists in
  any repository. Only Superhero can say whether one is published.

The `disabled: true` flag on the mainnet network entry is no longer an open question: it is
vestigial and inert, and [Networks & Endpoints](/aeternity/networks) traces it end to end.

### resources/brand

All three need a brand document Superhero has not published; ask at
`superherowallet@protonmail.com` before relying on an assumption.
- **Is there a written brand licence separate from the terms of use?** The branding page presents
  assets as a "resource hub … to help you create materials", while section V of the terms requires
  prior written consent for any reproduction. No document reconciling the two appears in any of the
  six repositories searched, so the conservative reading above is the one to follow: treat the
  download button as convenience, not permission.
- **Are there approved logo clear-space, minimum-size or misuse rules?** The brand kit publishes
  colours, type and files but no layout specification, and nothing of the sort exists in
  `superhero/public/` — the shipped assets are `full-logo.svg`, `logo.png` and `og-default.png` with
  no accompanying guideline. A published brand guide would close this.
- **Is a light-background logo variant available?** Every asset in the kit is presented on the
  `#0a0a0f` background, `full-logo.svg` is the only vector shipped, and no inverse lockup exists in
  the repository. If you need one, ask rather than recolouring the SVG yourself — a modified mark is
  exactly what section V prohibits.

### resources/legal

All three are questions for Superhero.com LVC at `superherowallet@protonmail.com`. They are legal
drafting questions, not engineering ones, and no amount of reading the code will answer them.
- **Which countries are excluded from the rewards programme?** The restriction is stated in the
  disclaimer above; the list is published nowhere. It is not a code-level control either — the
  backend has no country field, geo-IP lookup or jurisdiction check anywhere in `src/`, so the
  exclusion is applied by hand or not at all. Only Superhero can produce the list.
- **Do the terms cover token sales and DAOs?** Section II, "Subject of activity", describes a
  newsfeed of donations and comments plus access to token-swap, wrapping and liquidity contracts. It
  does not mention bonding-curve token sales, community DAOs or the ProtocolDAO token, which are the
  product's central mechanisms — and the contracts confirm those mechanisms are live, not planned.
  Whether they are intended to fall under the same section is not determinable from the document as
  published on 29 September 2025; it needs either an amended Section II or a written clarification.
- **Are there separate terms for the mobile apps or for Superhero Wallet?** The linked documents
  address "the Website" and the Interface. No app-store or wallet-specific agreement appears in any
  repository, including `superhero-com/superhero-wallet`. The app-store listings themselves are the
  next place to look.

### resources/links

Each of these needs a statement from Superhero. No further code reading will settle them.
- **Is there an official community channel beyond the X account above?** The FAQ refers to "official
  channels listed in the app" in the plural. Six repositories were searched and only
  `@superhero_chain` is identifiable. If a Discord or Telegram exists, Superhero must publish it —
  **do not add an invite to this page on the strength of a search result, a social post, or someone
  saying so.** The whole value of this page is that every URL on it traces to a repository or to
  official æternity documentation.
- **What availability can you expect from `mdw.wordcraft.fun`?** Its operator is now reasonably
  clear — the backend's deployment guide pulls mainnet database backups from `dev.wordcraft.fun`,
  and the API's package name (`wordcraft-api`) and Swagger title ("WORD CRAFT Scan") share the
  brand, so it is almost certainly the same team rather than a third party. What is unpublished is
  any commitment: no SLA, rate limit, version policy or maintenance window for that host appears
  anywhere.

### resources/support

These three can only be closed by Superhero. Nothing in any repository settles them, and no amount
of further code reading will.
- **What are the "official channels listed in the app"?** The FAQ's support answer points at them
  without naming them. Six repositories were searched — the web app and its locale files, the
  backend, the agent skill, the BCL contracts, the governance contracts and the tipping contract —
  and the only official account any of them identifies is `@superhero_chain` on X, named in the
  posting-reward copy rather than as a support route. Superhero must publish the list, or a
  maintainer must confirm it; **do not add a Discord or Telegram link to this page on any weaker
  evidence.** See [Official Links](/resources/links).
- **Is there a security disclosure policy or bug bounty?** No `SECURITY.md`, no security address and
  no bounty programme exists in any of the six repositories. Whether
  `superherowallet@protonmail.com` is monitored for security reports — and by whom — is not
  established anywhere. Closing this means Superhero publishing a `SECURITY.md` or a disclosure
  address; until then, assume a report to that address may sit with a legal or privacy inbox rather
  than an engineer.
- **Is there a response-time expectation?** None is published for any channel. The GitHub trackers
  are public, so their issue history is the only available signal, and it is a signal about past
  behaviour rather than a commitment.

### resources/whitepaper

- **Is there a downloadable PDF?** The whitepaper is a Markdown string rendered client-side in
  `src/views/Whitepaper.tsx`. No PDF asset exists in the repository's `public/` directory and no
  download link appears in the app. Only Superhero can publish one.
- **Is there a version history?** The document is labelled "Version 0.7 — February 2026" with no
  changelog, and versions 0.1 through 0.6 are not published anywhere in these repositories. A reader
  who needs to know what changed between versions has nothing to compare against. Superhero would
  have to publish the earlier revisions or a changelog.
- **Are the divergences above intended, or is the whitepaper simply behind the code?** Each row is a
  factual difference; none of them says which side is the mistake. Only the authors can say whether,
  for example, the ProtocolDAO multiplier is meant to apply to the curve price or to the all-in
  price, and whether the app's 950× display is the intended figure.
- **Has any contract been audited since publication?** The contract headers say no, and no report
  appears in any repository. A published audit — with a firm, a date and a commit hash — would close
  this; nothing short of that should.

### defi/bridge

The *status* is settled — the feature is commented out at the route table and nothing imports it.
What remains open is intent and live state, and neither is in any repository. The backend confirms
the shape of the gap: `superhero-api` has no bridge module, no bridge plugin and no bridge
endpoint. Its only reference to the asset is the aeETH token address in
`src/dex/config/dex-contracts.config.ts`, which exists so the DEX can price the pair — exactly the
"aeETH still trades, bridging does not" position described above.
- **Why was the bridge disabled, and will it return?** The code carries re-enable instructions but
  no reason and no date. Only a maintainer can say whether this was maintenance, a security
  response, or an abandonment — ask on
  [the app's issue tracker](https://github.com/superhero-com/superhero/issues).
- **Are the bridge contracts holding funds and accepting transfers today?** Their *identity* is
  settled: æternity's own bridge front-end points at the same four addresses Superhero's disabled
  code does. What is not settled is their operational state. Closing this means querying
  `ct_2Xdym95f2i998W9Zoh1NgAB7pVuQ34ztEsema7u4XwSoq5VKUJ` on æternity and
  `0xd099E3Ab65d6294d1d2D1Ad92897Cc29286F8cA5` on Ethereum for their balances and recent
  activity.
- **Would Superhero endorse `ae-bridge.com`?** That the domain is æternity's own bridge
  deployment is settled from `aeternity/aepp-bridge`. What no source answers is whether Superhero
  considers it the supported replacement for the feature it switched off — nothing in the app or
  the backend links it, and a docs page should not manufacture an endorsement. Superhero would have
  to say so, or link it.
- **What were the fees and settlement times?** The disabled code documents a 12-hour cooldown on
  æternity-originated transfers and balance thresholds, but no fee schedule and no expected
  settlement window in either direction. The operating bridge's own interface is the only source.

### defi/buy-ae

- **What are each provider's limits, fees and supported countries?** Not determinable from any
  Superhero repository — the app stores a link and nothing else, and the backend has no on-ramp
  module at all. Each provider's own terms page is the only source, and they vary by the country
  you are in, so no figure quoted here would be right for every reader.
- **Will the in-app ETH on-ramp return?** The code carries re-enable instructions but no reason for
  the disablement and no timeline, and `superhero-api` has no corresponding endpoint to re-point at.
  Only a maintainer can say; see [Bridging from Ethereum](/defi/bridge) for the same question about
  the bridge it shared code with.
- **Is the "coming soon" label on the X earning card accurate?** More likely than it looked. The
  backend's X posting reward is built but gated behind several environment switches that ship off:
  `.env.example` sets `PROFILE_X_POSTING_REWARD_ENABLE_POST_FETCH=false` (which short-circuits every
  reward evaluation with `post_fetch_disabled`), `PROFILE_X_PERPOST_REWARD_ENABLED=false` and
  `PROFILE_X_INVITE_MILESTONE_REWARD_AMOUNT_AE=0`
  (`superhero-api/src/profile/profile.constants.ts`, `.env.example`). Those are example values, not
  the production configuration, so what remains unknown is which switches `api.superhero.com`
  actually has set — a question only Superhero can answer.

### defi/explore

- **On what criteria does Superhero set `listed`?** The mechanism is settled — an API-key-guarded
  `POST /api/dex/tokens/<address>/listed`, defaulting to `false` — but the code contains no
  eligibility rule, so the policy behind the switch exists only as an operator practice. Only
  Superhero can state it.
- **Will `tvl` be fixed to mean TVL?** `src/dex/docs/token-calculation.md` specifies the correct
  computation and the code does not implement it, so this is either an unfinished task or a
  deliberate proxy. A maintainer would have to say which; until then treat the column as volume.

### defi/pools

- **Are the Fees Earned and Total Value tiles planned, or abandoned?** Both are unimplemented
  rather than broken: one is a literal string, and the other reads an optional field no code
  writes. The backend could supply what they need — `GET /api/dex/pairs/<address>` returns reserves
  and total supply, and `AePricingService` already converts AE to fiat — so this is a front-end
  gap. Only a maintainer can say whether it is on the roadmap.
- **Is the factory's protocol fee currently switched on, and who holds `fee_to_setter`?** The
  mechanism is fully settled above; the live state is not. `AedexV2Factory.init` sets
  `fee_to = None` and the contracts' README describes it as initially disabled, but nothing in
  either repository records whether it was ever enabled or which account was passed as the initial
  `fee_to_setter` at deployment. Two read-only dry-run calls against the mainnet factory
  `ct_2mfj3FoZxnhkSw5RZMcP8BfPoB1QR4QiYGNCdkAvLZ1zfF6paW` settle both: call `fee_to()` and
  `fee_to_setter()`. Until they are made, assume providers keep the full 0.3% but verify before
  relying on it.

### contracts/addresses

- **Are these addresses still current on chain?** No address here has been confirmed against a
  node or against `GET /api/contracts`. Before relying on one, re-read it from
  `GET /api/factory` for the factory-owned addresses, or from `superhero/src/config.ts` on the
  deployed build for the rest.
- **What is the mainnet `disabled: true` flag for?** It sits on the whole mainnet
  `NetworkDefinition` in `superhero/src/config.ts`, not on the DEX addresses as previously
  assumed here, and `src/utils/constants.ts` copies it through to `CURRENT_NETWORK.disabled`.
  Nothing in the web app then reads it — the only `.disabled` consumers in `src/` are
  `AppSelect.tsx` for dropdown options and `BuyAe.tsx` for payment methods, both unrelated. So
  it is inert in the current build and its intent is undocumented. Ask whoever added it, or
  check whether a deploy-time config consumes it.

### contracts/aex9

All four of these are answerable from one file that is not present here:
`contracts/fungible-token-full.aes` at tag **v2.2.0** of
[aeternity/aeternity-fungible-token](https://github.com/aeternity/aeternity-fungible-token),
which is the exact revision `bcl-contracts` pins. Read that, and all four close at once.
- **Which extensions `aex9_extensions()` actually reports.** The entrypoint exists in the ACI
  and the presence of `swap`, `mint`, `burn` and the allowance family implies
  `["allowances", "mintable", "burnable", "swappable"]`, but the literal list is in the source,
  not the ACI, and was not read.
- **Whether `change_allowance` reverts on a negative result.** The ACI types `value_change` as a
  plain `int`, so a negative delta is well-typed. What happens when it would drive the allowance
  below zero — abort, or clamp — is in the source.
- **Whether `create_allowance` aborts when an allowance already exists.** The agent skill
  branches on existence and calls `change_allowance` instead, which strongly implies it does.
  The allowance example above is correct either way.

One of the original four is now settled negatively: **`swap` is not used anywhere in
Superhero.** A search across `superhero-api/src` and `superhero/src` for `swap()`, `swapped()`
and `check_swap` returns no call site in either — every `swap` hit in the backend belongs to the
DEX, which is unrelated. The AEX-9 migration mechanism exists in the implementation and
Superhero has never exercised it. If you want to be certain for a particular token, call
`swapped()` on it; a non-empty map would mean otherwise.

### contracts/bonding-curve

- **Does the deployed bytecode match this source?** Every constant, the 100-iteration cap and
  the `get_sell_return_precision` bug above are read from
  `bcl-contracts/contracts/BondingCurveExponential.aes`. Confirming that mainnet carries that
  same build means compiling the source and comparing against
  `bcl-contracts/generated/bytecode_hashes.json`, then against the bytecode the node returns
  for the address `factory.bonding_curve()` resolves to. That comparison has not been made.

### contracts/calling-contracts

- **Whether `callStatic` reports the same gas as a mined call for multi-contract
  transactions.** `create_community` deploys a `CommunityManagement`, a `DAO`, a sale and its
  AEX-9 token through `Chain.create` in one call, and then optionally performs an initial buy
  that reaches two more contracts. Whether a dry run's `gasUsed` covers all of that identically
  to a mined call needs one measurement against a live node: run `create_community` with
  `callStatic: true`, note `result.gasUsed`, then mine the same call and compare. Until someone
  does, keep the 30% margin the page recommends.

### contracts/events

- **The query parameter name for server-side event filtering.** The encoding is now settled —
  padded base32hex of the Blake2b digest, as shown above — but the Superhero backend never
  passes it as a filter; it fetches by `contract_id` (plus `tx_hash`) and matches `event_hash`
  client-side. Whether `/v3/contracts/logs` accepts an `event_hash=` or similar parameter, and
  what it is called, is settled by the middleware's own OpenAPI document — fetch
  `{middlewareUrl}/v3/api` and read the `/v3/contracts/logs` parameter list. Client-side
  filtering on `topics[0]` or `event_hash` always works regardless.
- **What `target` accepts on the `Object` channel.** The subscribe message shape is now
  settled from the Superhero backend's own client, but that client only ever subscribes to
  `Transactions`, `MicroBlocks` and `KeyBlocks` — it declares the `Object` channel and never
  uses it, so nothing in the repository shows what a `target` looks like or whether a contract
  address is a valid one. The [ae_mdw repository](https://github.com/aeternity/ae_mdw) is the
  place to settle it.
- **Whether the ProfileRegistry event names are exactly as the whitepaper spells them.** The
  six hashes in that section are correct only if the names are, and neither an ACI nor a source
  file for `ProfileRegistry.aes` exists in any repository read. The contract now
  looks retired, so this may never be settleable — and may not be worth settling. What would
  close it: the `ProfileRegistry.aes` source, or the deployed address plus a decompile.

### contracts/governance-contracts

- **Is the mainnet registry the compiler-6 build, or the original?** Both declare the same
  entrypoints and events, and they differ observably only in `version()` — `1` for
  `Registry.aes`, `2` for `Registry_Compiler_v6.aes`. Call `version()` on
  `ct_ouZib4wT9cNwgRA1pxgA63XEUd8eQRrG8PcePDEYogBc1VYTq`, or compare the deployed bytecode
  against the `Registry_Compiler_v6.aes` hash
  `3acd08e525abd0820eb3cb45cc3e5ea148338355e33fc4cbbe3417134441556e` in the backend's
  `GovernanceBytecodeHashes.json`. The same question applies to whichever `Poll` build
  `PollBytecode.json` carries.

### contracts/profile-registry

- **Where is the `AddressLink` contract deployed?** Not in any repository. The backend reads it
  from `ADDRESS_LINK_CONTRACT_ADDRESS` at boot and logs `AddressLink contract configured at`
  followed by the address on startup, so the fastest route is a running `superhero-api`
  deployment's environment or its first log line. There is no fallback default in
  `address-links.constants.ts` — an unset variable disables the whole plugin with a warning.
- **Where is the `AddressLink.aes` source?** Only the compiled ACI is committed. Everything on
  this page about its behaviour that is not in that ACI — the nonce increment rule, whether
  `register_provider` is first-come or gated, what `ALREADY_CLAIMED` compares — is inferred
  from the backend's error mapping rather than read from Sophia. Ask the Superhero contract
  team for the source.
- **Is `ProfileRegistry.aes` still deployed, and at what address?** No address appears in
  `superhero/src/config.ts`, in the web app, or in the agent skill, and nothing in
  `superhero-api` reads or writes it. It may still hold state that nobody consults. Settling
  this needs the contract team, or a middleware search for a contract emitting
  `CustomNameAutoRenamed`.
- **Where is the `ProfileRegistry.aes` source?** A GitHub code search for
  `set_x_name_with_attestation` and `CustomNameAutoRenamed` across all public repositories
  returns exactly one hit each — the whitepaper string in
  `superhero-com/superhero/src/views/Whitepaper.tsx`. Either the repository is private or the
  contract was never published. Given that it has been superseded, this is now of historical
  interest only.

### contracts/security

- **Is there a non-public audit?** The contract headers and the whitepaper both say no, and
  nothing in either repository or in public `superhero-com` repositories contradicts that. An
  audit commissioned but not published would not be visible here. Ask the Superhero team
  directly.
- **Where should vulnerabilities be reported?** No disclosure policy exists. This is the most
  actionable gap on this page: a project holding user funds should publish a security contact.
- **Has the deployed bytecode been verified against the published sources?** This is now the
  load-bearing gap on this page: everything above is read from Sophia in `bcl-contracts`,
  `aepp-governance` and `tipping-contract`, and none of it binds unless the addresses on
  [Deployed Addresses](/contracts/addresses) carry those exact builds. `bcl-contracts/generated/`
  ships `bytecode_hashes.json` and `source_hashes.json`, and
  `superhero-api/src/plugins/governance/contract/aci/GovernanceBytecodeHashes.json` ships the
  governance pair, so the comparison is mechanical — compile, hash, and fetch the deployed
  bytecode from a node, then check the two hashes against each other.
- **Is the `AddressLink.aes` source available anywhere?** Only its compiled ACI is committed, in
  `superhero-api`. Its nonce increment rule, its provider-registration policy, and what
  `ALREADY_CLAIMED` compares are inferred from the backend's error mapping rather than read.
  For a contract that is now the identity root, that is a real gap. Ask the contract team.

### tokens/collections-and-naming

- **Whether any collection exists on-chain beyond the four the backend indexes.** `CommunityFactory` has no entrypoint that enumerates `collection_registry`, so the only way to find out is to replay `CreateCollection(string, address)` events from the factory at `ct_25cqTw85wkF5cbcozmHHUCuybnfH9WaRZXSgEcNNXG9LsCJWTN` and compare the result against the `BCL_FACTORY` mainnet configuration. Any extra collection would be tradable on-chain but invisible in the app.

### tokens/create-from-cli

- The `check` subcommand reports `allowed_chars` as the fixed string `"A-Z, 0-9, - (dash)"` regardless of the collection it just looked up. That happens to describe the `WORDS` collection, which the script always uses, and is wrong for the other three — see [Collections & Naming Rules](/tokens/collections-and-naming) for the real character sets. The script does not decode the schema's `allowed_name_chars`.

### tokens/create-from-dashboard

- The exact gas cost of `create_community` on mainnet is not documented anywhere in the repositories; the 0.001 AE figure comes from the agent skill's token-creation guide and is described there as approximate. It is likely to be an understatement, because one `create_community` call deploys four contracts — the AEX-9 token, the sale, the DAO and community management — and performs an initial buy. A single mined creation transaction on aeScan would give the real number.

### tokens/fees-and-slippage

- **Gas for a buy, a sell and a post is undocumented.** No figure appears in the web app, the whitepaper, the FAQ, the agent skill or the contract repository. Mining one of each and reading the fee off [aeScan](https://aescan.io) would produce real numbers; they will vary with the contract's gas usage, so a range is more honest than a point estimate.

### tokens/portfolio

- **Whether `balance_ae_value` was ever served, or is a documentation error in the skill's portfolio guide.** No field of that name appears in the backend's holdings response or in the current script's output. If you are writing against the guide rather than the API, compute it yourself from `balance` and a `sell_return(balance)` call — and mind the rectangle-versus-integral caveat above.

### tokens/risks

- **Whether an audit has been completed since deployment.** The contract sources are explicitly marked unaudited, but those banners date from the code as written and would not be updated by an audit performed afterwards. No report, auditor or date appears in any repository or published page consulted for this documentation. If one exists, this page should name the auditor, the scope, the date and the resolution of any findings.
- The gas cost of a buy, a sell and a post is undocumented, so the friction figures above count the 1% spread only. Real round-trip friction is the spread plus three transaction fees, since a sell is two transactions.

### tokens/transactions

- **What `verified` actually asserts.** It is a boolean column on every row, defaulting to `false`, and the indexer sets it — but the condition under which a row is promoted to `verified` is not stated anywhere the column is defined. Do not treat `verified: false` as "this trade did not happen" without establishing what the flag means; the `_should_revalidate` path in `superhero-api/src/plugins/bcl/services/transactions.service.ts` is the place to start.

### tokens/trending-score

- **The distribution of live scores is unknown.** The formula bounds the score in `[0, 1]`, but where real tokens actually sit in that interval — whether a busy token reaches 0.5 or tops out near 0.1 — cannot be derived from the weights alone. Pull `GET /api/tokens?order_by=trending_score&limit=100` and look at the spread before setting any absolute threshold.
- **Whether the weights and caps documented here match what mainnet is running.** They come from `superhero-api/src/configs/constants.ts` in the checked-out backend; a deployed instance could be on a different revision. `GET /api/tokens/{address}/score` echoes each signal's `cap` alongside its `raw` value, so one call against the live API confirms or refutes the whole table.

### aeternity/ae-and-gas

- **The per-action costs above are estimates, not measurements.** They are the agent skill authors'
  observations, without a block height or gas price attached, and no contract determines them — gas
  depends on the deployed bytecode, and the price on network demand at execution. Buy and sell have
  no figure at all. What would close it is a table of `gasUsed` — which is a property of the
  bytecode and stable between runs — separately from `gasPrice`, which is not. Submit one
  transaction of each kind on mainnet, open it on [æScan](/aeternity/explorers), and record
  `gasUsed`, `gasPrice` and the keyblock height together. The contract comment quoted above
  (~0.000201 AE for an invitation redemption) is the only measured number available anywhere in
  these repositories, and it covers one call shape at one price.

### aeternity/networks

- **What uptime can you expect from any of these hosts?** No SLA, availability target or maintenance
  policy is published for `api.superhero.com`, `mdw.wordcraft.fun`, the `*.prd.service.aepps.com`
  hosts or the public æternity nodes. Superhero and the æternity Foundation would each have to state
  their own; nothing in any repository does.
- **Does `mdw.wordcraft.fun` run the same node and middleware versions as `mainnet.aeternity.io`?**
  A `GET /v3/status` against each returns `node_version`, `node_revision` and `mdw_version`.
  Comparing the two answers settles it in one step: `curl https://mdw.wordcraft.fun/v3/status`
  against the same path on `mainnet.aeternity.io`. It matters if you depend on a middleware
  feature added in a specific release.

### aeternity/sophia-and-fate

- **Which compiler built the deployed governance contracts?** Their repository publishes the
  reverse index that answers this — a bytecode hash per contract for all 27 compiler versions — but
  not the answer itself. Fetch the deployed `Poll_Iris` and `Registry_Compiler_v6` bytecode from
  the node, hash it, and look the hash up in
  `aepp-governance/governance-contracts/generated/bytecode_hashes.json`. That is one node call per
  contract. BCL (8.0.0) and Tipping (7.4.1) are settled from their own single-key files.
- **Which compiler built ProfileRegistry?** Nothing settles this, and the trail has gone cold:
  no ProfileRegistry source repository has been located, and the current backend no
  longer even carries its ACI — the only references left are two comments describing its indexer in
  the past tense (`superhero-api/src/profile/services/profile-read.service.ts` and
  `src/plugins/address-links/address-links-plugin-sync.service.ts`), which have been superseded by
  the AddressLink plugin. Answering it needs both a source tree and the deployed bytecode.
  Superhero would have to point at the repository.

### aeternity/state-channels

- **Do state channels appear anywhere on Superhero's roadmap?** Still unrecorded, and the search is
  now wider: no channel code, configuration or contract appears in the web app, the backend
  (`superhero-api`), the agent skill, the BCL contracts, the tipping contract or the governance
  contracts. The whitepaper mentions channels only as a property of the chain, and no repository
  contains a roadmap document. Only Superhero can answer this; the
  [issue tracker](https://github.com/superhero-com/superhero/issues) is where to ask.

