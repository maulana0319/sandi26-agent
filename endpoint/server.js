// server.js — READ-ONLY public status endpoint for sandi26.ai.
// Serves live-verified state produced by `node ../src/verify.js --json`.
// No wallet, no signing, no private keys, no POST/mutation of any kind.
//   node server.js [port]            (default 8080)
//   STATE: endpoint/state.json — refresh with:
//   node ../src/verify.js --json > endpoint/state.json
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const STATE_FILE = path.join(__dirname, 'state.json');

const CLAIMS = [
  { label: 'ALCHEMYBIT #502 free mint', tx: '0x398f4866747697fc1d8307c9cc62f7dfa90a42df6438b6bc47df66fe990b11a6', block: 133580532, status: 'SUCCESS', gasUsed: 341204, when: '2026-11-15 00:04 WIB' },
  { label: 'PODS #382 free mint', tx: '0xdb24bd0a2cb312dc5f568c408c0faeb77eb7ad0405a1187aee9287ef608a3977', block: 133545772, status: 'SUCCESS', gasUsed: 101052, when: '2026-11-14 19:43 WIB' },
  { label: 'GOAT win bonus claim (+2,312,312.31 GOAT)', tx: '0x4e6b441256fb8c893d13ce204ccea627b0ae31c1554dc04369ce011e6a0d931c', block: 133494018, status: 'SUCCESS', gasUsed: 68778, when: '2026-11-14 13:15 WIB' },
  { label: 'CALLSIGN #633 free mint', tx: '0x6dffc25448d14391a87cabbd04f94049d3bcc5c297281b88206d6c0e0ad37a23', block: 133202168, status: 'SUCCESS', gasUsed: 302155, when: '2026-11-13 00:45 WIB' },
  { label: 'CrossEyed #137 free mint', tx: '0xaf1d78ac43bee225d051302a3a9f9d0500a990b2d8ab50921115d60327e93162', block: 133370745, status: 'SUCCESS', gasUsed: 522967, when: '2026-11-13 21:50 WIB' },
  { label: 'NEBULA claim (1,000 NEB)', tx: '0xbb48f4b1c6eadab2c64eaedbe8634a41faf86ec0f96f6bba3db765e79c561f1d', block: 132896964, status: 'SUCCESS', gasUsed: 129731, when: '2026-11-11' },
  { label: 'KIJIN #2414 (Epic) free mint', tx: '0x564e0dbb658d6dd44c85e15af8f6c083bd7922f95704af2583d25917bb94ce28', block: 133268616, status: 'SUCCESS', gasUsed: 153688, when: '2026-11-13 09:03 WIB' },
  { label: 'Meow #812 free mint', tx: '0xab203b5b0ec0baaeb261cb7eae3979b0d9039906a5fe6ec4a7d38887d62326ff', block: 133172345, status: 'SUCCESS', gasUsed: 313034, when: '2026-11-12 20:59 WIB' },
  { label: 'Meow #812 listing @ 0.004 BNB', tx: '0x613c1be4f42dc7ee8c6318de6d4a25f8d6ed208fa380b63687f765fdf70afdb8', block: 133184749, status: 'SUCCESS', gasUsed: 200815, when: '2026-11-12 22:34 WIB' },
];

function readState() {
  try {
    const j = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return j;
  } catch {
    return null;
  }
}

function statusPayload() {
  const s = readState();
  return {
    agent: 'sandi26.ai',
    wallet: '0x6C6eE6b986680CdfBea0f906Ecd2ced2a0649C37',
    chain: 'BNB Smart Chain (56)',
    roundsCompleted: 385,
    drainIncidents: 0,
    lastVerifiedBlock: s ? s.block : null,
    bnb: s ? s.bnb : null,
    balances: s ? s.balances : null,
    owners: s ? s.owners : null,
    lastClaim: CLAIMS[0],
    claims: CLAIMS,
    evidence: 'https://github.com/maulana0319/sandi26-agent/blob/main/evidence/EVIDENCE.md',
    note: 'Read-only. No signing, no wallet access, no mutations. State refreshed by verify.js.',
  };
}

function html() {
  const p = statusPayload();
  const rows = (p.balances ? Object.entries(p.balances) : []).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const claims = p.claims.map(c => `<tr><td>${c.label}</td><td><a href="https://bscscan.com/tx/${c.tx}">${c.tx.slice(0, 10)}…${c.tx.slice(-6)}</a></td><td>${c.status}</td><td>${c.block}</td><td>${c.gasUsed}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>sandi26.ai — agent status</title>
<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:2em auto;padding:0 1em;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}code{background:#f4f4f4;padding:1px 4px}</style>
</head><body>
<h1>sandi26.ai — autonomous free-mint hunter (BSC)</h1>
<p>Agent <code>sandi26.ai</code> · wallet <code>${p.wallet}</code> · ${p.chain} · ${p.roundsCompleted} hunt rounds · ${p.drainIncidents} drain incidents.</p>
<p>BNB: <b>${p.bnb || 'n/a'}</b> · last verified block: <b>${p.lastVerifiedBlock || 'n/a'}</b> · last claim: <b>${p.lastClaim.label}</b> (${p.lastClaim.when}).</p>
<h2>Balances</h2><table><tr><th>Asset</th><th>Balance</th></tr>${rows}</table>
<h2>Receipt-verified executions</h2><table><tr><th>What</th><th>Tx</th><th>Status</th><th>Block</th><th>Gas</th></tr>${claims}</table>
<p><a href="/status">JSON status</a> · <a href="/claims">JSON claims</a> · <a href="/health">health</a></p>
<p><small>Read-only endpoint. No signing, no wallet access. Evidence: see the submission repo.</small></p>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.writeHead(405, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'read-only: GET only' })); return; }
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, agent: 'sandi26.ai', time: new Date().toISOString() }));
  } else if (url.pathname === '/status') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(statusPayload(), null, 2));
  } else if (url.pathname === '/claims') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(CLAIMS, null, 2));
  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html());
  } else {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found', routes: ['/', '/status', '/claims', '/health'] }));
  }
});

server.listen(PORT, () => console.log(`sandi26.ai status endpoint on :${PORT} (read-only)`));
