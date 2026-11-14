# Video walkthrough — script and slides (5 minutes)

Format: narrated slide walkthrough (slides + voiceover), built with
`/opt/hatch/bin/tts` (narration), PIL (slides, 1280x720) and ffmpeg
(assembly). This is **not a live screen recording** — it is a narrated
walkthrough with real terminal output shown on slides. The terminal output on
slide 4 is genuine output from running `node recon.js` against the live
ALCHEMYBIT contract (15 Nov 2026, 03:32 WIB).

Target length: ~5:00 (4:45–5:15 acceptable). Narration: English, one voice.

## Segment 1 — Intro (~30s)

**Narration:** "Meet sandi26.ai — an autonomous agent that hunts free mints and
claims on BNB Smart Chain, nonstop, since November 6th, 2026. In nine days it
ran 385 hunt rounds, and every result it produced is backed by a public
transaction receipt you can check on BscScan."

**Slide:** `sandi26.ai` / Autonomous free-mint hunter — BSC · 385 rounds ·
9 receipt-verified executions · 0 drain incidents

## Segment 2 — The problem (~30s)

**Narration:** "Free mints on BSC open and sell out in minutes. A human cannot
watch a dozen sources, read a contract, check the quota, and fire a transaction
in time. This agent does — around the clock."

**Slide:** THE PROBLEM / Free mints sell out in minutes / 12+ sources ·
contract read · quota check · fire — faster than a human

## Segment 3 — The loop (~35s)

**Narration:** "The loop has four stages. Scout: it watches X, Facebook,
Binance Square, GitHub and aggregator boards for new Agent ID drops. Recon: it
crawls the project's site and JavaScript bundles, extracts contract addresses
and mint functions, and loads the verified ABI from Sourcify. Verify: it reads
every quota and eligibility getter on-chain. Fire: it simulates, previews,
executes exactly once, and verifies the receipt."

**Slide:** THE LOOP / SCOUT → RECON → VERIFY → FIRE / sources → Sourcify ABI
→ on-chain getters → preview → execute once → receipt

## Segment 4 — Recon, live (~40s)

**Narration:** "Here is recon running live against a real contract — AlchemyBit,
the agent's most recent mint. It found the contract, confirmed Sourcify exact
match, read the getters, and listed the mint candidates with a ready fire
command. This is the same code in the repo — recon dot j s — running against
the live chain."

**Slide:** real terminal output (trimmed) — see `recon_demo.txt`:
`=== RECON (8.8s, 2026-11-15 03:32:20 WIB)`,
`wallet 0x6C6e…C37 agentId sandi26.ai`,
`## 0xca3a9Fe5…68654F code=17022B sourcify=exact_match`,
`MINT CANDIDATES: freeMintX … 0xfcdc1895`, `mint(uint256) PAYABLE 0xa0712d68`

## Segment 5 — Safety rails (~40s)

**Narration:** "Safety is not a feature here, it is the design. Before any
broadcast, the Binance wallet preview must be clean: simulation code zero, no
allowance changes, no authority changes, no risk flags, and outflow within the
approved cap. Anything else is a hard stop. Paid mints need an explicit amount
and an explicit cap. One broadcast only — a lock file makes a repeat
impossible. And there is an anti-drain rule that overrides everything: any
contract that could drain the wallet is excluded, even if the mint looks free."

**Slide:** SAFETY RAILS / clean preview or no broadcast · value 0 default ·
paid needs amount + cap · one broadcast, lock file · anti-drain overrides all

## Segment 6 — Evidence (~40s)

**Narration:** "The receipts speak for themselves. AlchemyBit number 502,
minted November 15th, block 133,580,532, gas 341,204. Pod Squad number 382.
The GOAT War win bonus — over 2.3 million GOAT claimed. Callsign 633,
CrossEyed 137, Nebula, Kijin 2414, Meow 812 — nine receipt-verified
transactions, all success, all value zero, gas only. The verifier script in the
repo re-checks every balance, every owner, and every receipt against public BSC
RPCs — run it yourself."

**Slide:** RECEIPTS (BscScan) / ALCHEMYBIT #502 · PODS #382 · GOAT +2,312,312 ·
CALLSIGN #633 · CrossEyed #137 · NEBULA · KIJIN #2414 · Meow #812 / 9 txs ·
all SUCCESS · all value 0

## Segment 7 — Live state, honestly (~30s)

**Narration:** "Live state, checked minutes ago: 4.3 million GOAT, one million
POWER, 20,000 Vein, 200,000 Virtual, 10 million Peshi. And the honest part:
liquid value is about five cents — most holdings are pre-pool tickets worth
zero today. This submission claims the system, not the balance."

**Slide:** LIVE STATE (block 133,608,393) / GOAT 4,312,312 · POWER 1,000,000 ·
VEIN 20,000 · VIRTUAL 200,000 · PESI 10,000,000 / liquid ≈ $0.05 — the system
is the submission, not the balance

## Segment 8 — Endpoint (~25s)

**Narration:** "The package also ships a read-only status endpoint — balances,
owners, and claims as JSON, no signing, no mutations. Honest note: the build
machine has no public address, so the endpoint needs a public host. The
deployment guide says so plainly."

**Slide:** ENDPOINT / GET /status · /claims · /health / read-only · no signing
· needs a public host — stated in DEPLOYMENT.md

## Segment 9 — Why Wildcard (~30s)

**Narration:** "Why Wildcard? The agent's core claim is verification before
trust — contracts verified, quotas read on-chain, transactions simulated,
results proven by public receipt. That is the same instinct as zkVerify's
proof-based verification, applied to the free-mint hunt. The agent does not
submit proofs to zkVerify today, and this video does not claim otherwise. What
it proves, on-chain, is 385 rounds of autonomous operation with a clean safety
record."

**Slide:** WHY WILDCARD / verification before trust / Sourcify · on-chain
quotas · simulation · public receipts / same instinct as proof-based
verification — no zkVerify integration claimed

## Segment 10 — Close (~20s)

**Narration:** "sandi26.ai — scout, verify, preview, fire once, verify the
receipt. The code, the evidence, and the verifier are in the repo. Thank you."

**Slide:** sandi26.ai / scout · verify · preview · fire once · verify receipt
/ code + evidence + verifier in the repo
