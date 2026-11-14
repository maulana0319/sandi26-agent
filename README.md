# sandi26.ai — Autonomous Free-Mint Hunter on BNB Smart Chain

> **Agent Games 2026 — Wildcard submission.** A real, working Web3 agent that has
> run nonstop since 6 November 2026: it scouts new free mints and claims on BSC,
> verifies every contract and quota on-chain, simulates every transaction before
> broadcasting, executes at most once, and verifies the receipt afterwards.
> Every claim it makes is backed by a public transaction receipt — see
> [`evidence/EVIDENCE.md`](evidence/EVIDENCE.md).

- **Agent ID:** `sandi26.ai` — wallet
  `0x6C6eE6b986680CdfBea0f906Ecd2ced2a0649C37` (BSC, chain 56)
- **Rounds completed:** 385 hunt rounds by 15 Nov 2026, each with a written report
- **Executions:** 9 receipt-verified transactions (mints, claims, a listing) —
  all SUCCESS, all value-0 (gas only)
- **Drain incidents:** 0

## What it does

Free mints and claims on BSC open and sell out in minutes. The agent runs a
continuous loop:

1. **Scout** — watches X, Facebook, Binance Square, GitHub, aggregator boards and
   Boltbook for new Agent ID drops and free-mint announcements.
2. **Recon** — for each candidate: extracts contract addresses, chain id and mint
   function signatures from the project's site, JS bundles and agent docs
   (`llms.txt`, `skill.md`, …); checks `eth_getCode`; loads the **Sourcify**
   verified ABI; reads every view getter (quota left, start time, price,
   per-wallet limit, eligibility of this wallet's Agent ID).
3. **Verify** — a candidate is executable only if: the contract is
   **Sourcify-verified**, the mechanism is confirmed from the project's official
   site/docs **and** on-chain, the free quota is open, this wallet has not
   claimed, and the value gates pass (token ≥ $0.2 with a live pool and
   immediately swappable ≥ $0.2 net, or NFT with a verified floor / real project).
   Social posts are leads, never proof. "Free" labels are not trusted — the
   exact cost is read from the contract.
4. **Simulate** — `eth_call` across 6 RPCs × {latest, pending}; reverts are
   decoded (custom errors via Sourcify ABI + 4byte) and classified
   `wait` / `fatal` / `unknown`. Only a clean simulation proceeds.
5. **Preview** — the Binance Agentic Wallet preview must be clean: simulation
   code `000000000`, **zero allowance/authority changes**, **zero RISK flags**,
   native outflow ≤ the approved cap. Anything else is a hard stop.
6. **Execute once** — a lock file is written before broadcast; the same
   to/data/value can never fire twice. Paid mints need an explicit amount **and**
   an explicit cap (`--value` + `--maxValue`); value 0 is the default.
7. **Verify receipt** — polls `eth_getTransactionReceipt`, checks status, reads
   the received tokenId from the Transfer event (never trusts a stale preview),
   and records the BscScan link.

## Safety rails (never skipped)

- **Anti-drain (overrides everything):** any token/coin/NFT whose contract or
  flow could drain the wallet is excluded outright — no unlimited approvals to
  untrusted spenders, no permit/`setApprovalForAll` to attackers, no hidden
  transfer functions, no upgradeable proxy that can switch to drain logic, no
  opaque calldata. A clean preview is mandatory.
- **Confirm-first by default:** auto-execution exists only inside the owner's
  own mandates (verified-free FCFS claims, auto-swap ≥ $0.2 net at ≤ 10% price
  impact with allowance revoked afterwards, auto-list of NFTs with a verified
  floor ≥ $5). Everything else needs an explicit per-item command.
- **NFT gas cap:** ≤ Rp 500 (≈ $0.03) of gas per free NFT mint, estimated
  *before* executing.
- **Fail closed:** ambiguous recipient / chain / token / amount → ask, don't
  guess. RPC 403 / rate-limit is transport noise, never a contract revert.
  A void function returning `0x` from `eth_call` is success, never a revert.
- **No auto-signin, no retry after broadcast:** if the wallet session drops,
  the agent stops and waits for the owner. After an execute (even an error),
  it never re-broadcasts.

## Architecture

```
                ┌──────────────┐  X / Facebook / Square / GitHub / boards
                │    SCOUT     │  (new drops, free-mint announcements)
                └──────┬───────┘
                       │ candidate (site URL / contract)
                ┌──────▼───────┐
                │    RECON     │  recon.js — crawl site+bundles+docs,
                │  (read-only) │  Sourcify ABI, getters, eth_call sim
                └──────┬───────┘
                       │ mint candidates + calldata + sim verdict
                ┌──────▼───────┐
                │    VERIFY    │  contract verified? quota open?
                │  (gates)     │  not claimed? value/floor gates?
                └──────┬───────┘
                       │ pass → wait for start
                ┌──────▼───────┐
                │     FIRE     │  fire.js — spin eth_call, baw preview
                │  (1 shot)    │  (clean only), baw execute ONCE, receipt
                └──────┬───────┘
                       │ tx hash + receipt + tokenId from logs
                ┌──────▼───────┐
                │    REPORT    │  round report, BscScan link, balances
                └──────────────┘
```

Shared helpers live in `lib.js`: an RPC race pool (first success wins; first
*revert* also wins, because reverts are deterministic), revert decoding and
classification, WIB logging, the `baw` runner, Agent ID lookup
(`handleOf` on registry `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`,
tokenId = `uint256(keccak256(handle))`), and cached Sourcify ABI fetches.

## Project layout

```
wildcard/
├── README.md                 # this file
├── LICENSE                   # MIT
├── src/
│   ├── package.json          # ethers ^6.13.4 (npm)
│   ├── lib.js                # RPC pool, revert decoding, baw runner, Agent ID
│   ├── recon.js              # read-only recon: site → contracts → sim
│   ├── recon.sh              # thin wrapper: ./recon.sh <url>
│   ├── fire.js               # one-shot executor with preview gates + lock
│   └── verify.js             # read-only on-chain verifier (balances, owners, receipts)
├── evidence/
│   └── EVIDENCE.md           # live-verified tx hashes, balances, owners
├── endpoint/
│   ├── server.js             # read-only public status endpoint (no signing)
│   └── DEPLOYMENT.md         # hosting assessment (honest: needs a public host)
└── video/
    ├── walkthrough.mp4       # 5-minute narrated walkthrough
    └── SCRIPT.md             # narration script + slide list
```

## Setup (no credentials needed to read, recon or verify)

```bash
cd src
npm install            # ethers only; no API keys anywhere
```

Execution (`fire.js`) needs the operator's own **Binance Agentic Wallet**
(`baw`) connected on BSC with Developer Mode on — it shells out to `baw` and
never handles a private key, seed phrase or session token. Without `baw` the
recon/verify path still works fully; `fire.js` refuses to run.

```bash
# 1. Recon a candidate (read-only, ~10s)
./recon.sh https://example-mint-site.xyz
./recon.sh --contract 0xCA...            # when the CA is known

# 2. Dry-run the fire (preview included, stops before execute)
node fire.js --to 0xCA... --data 0x... --start 23:00 --label demo --dry

# 3. Execute (only on the owner's explicit command for that mint)
node fire.js --to 0xCA... --sig "claimFree()" --start 23:00 --label demo

# 4. Verify the wallet's on-chain state any time (read-only)
node verify.js
node verify.js --json
```

## Evidence (live-verified 15 Nov 2026, block 133,608,393)

Full table with BscScan links: [`evidence/EVIDENCE.md`](evidence/EVIDENCE.md).
Headline receipts:

| What | Tx | Result |
|---|---|---|
| ALCHEMYBIT #502 free mint | `0x398f48…b11a6` | SUCCESS, block 133,580,532, gas 341,204 |
| PODS #382 free mint | `0xdb24bd…3977` | SUCCESS, block 133,545,772, gas 101,052 |
| GOAT win bonus, +2,312,312.31 GOAT | `0x4e6b44…931c` | SUCCESS, block 133,494,018 |
| CALLSIGN #633 free mint | `0x6dffc2…a23` | SUCCESS, block 133,202,168 |
| CrossEyed #137 free mint | `0xaf1d78…3162` | SUCCESS, block 133,370,745 |
| NEBULA claim, 1,000 NEB | `0xbb48f4…f1d` | SUCCESS, block 132,896,964 |
| KIJIN #2414 (Epic) free mint | `0x564e0d…ce28` | SUCCESS, block 133,268,616 |
| Meow #812 mint + listing @ 0.004 BNB | `0xab203b…26ff` / `0x613c1b…db8` | SUCCESS / SUCCESS |

Live holdings at the same block: 4,312,312.31 GOAT, 1,000,000 POWER, 20,000
VEIN, 200,000 VIRTUAL, 10,000,000 PESI, 10,000,000 BNBbaby, 50,000 KUMO, and
one each of KIJIN, PODS, ALCHEMYBIT, Agent Cards, ONLYAI, CALLSIGN, SYMBOL NFT,
GOAT NFT. Honest note: liquid value is ≈ **$0.05** (below the agent's own $0.2
swap bar, so 0 swaps) and most holdings are pre-pool tickets worth $0 today —
this submission claims the system, not the balance.

## Why Wildcard (and zkVerify, honestly)

The agent's core claim is **verification before trust**: contracts verified
against Sourcify, quotas read on-chain, every transaction simulated, and every
result proven by a public receipt. That is the same instinct as zkVerify's
proof-based verification, applied to the free-mint hunt. The agent does not
currently submit proofs to zkVerify — the Wildcard entry is the agent itself,
not a zkVerify integration — and the video says so plainly. What it does prove,
on-chain, is 385 rounds of autonomous operation with a clean safety record.

## Limitations

- BSC only. The agent never bridges, never funds ETH, never changes chain.
- It depends on the Binance Agentic Wallet for signing; it cannot sign by
  itself and never asks for a private key.
- Public RPCs rate-limit; the RPC race pool and transport/revert distinction
  exist because of that.
- The public status endpoint (`endpoint/`) is written but needs a public host —
  see `endpoint/DEPLOYMENT.md`. The submission does not pretend the VM it was
  built on is publicly reachable.
- The 5-minute video is a narrated walkthrough with real terminal output, not
  a live screen recording — see `video/SCRIPT.md`.
