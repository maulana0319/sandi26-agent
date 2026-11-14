# Endpoint hosting — honest assessment

## Status: code ready, public hosting NOT yet available

`server.js` is a complete read-only status endpoint (zero dependencies, Node
built-ins only): `GET /` (HTML dashboard), `GET /status`, `GET /claims`,
`GET /health`. It serves state produced by `node ../src/verify.js --json >
endpoint/state.json`. It cannot sign, cannot move funds, and accepts no
mutations (non-GET returns 405).

## Why it is not live from the build machine

The VM this package was built on has **no publicly reachable address**:

- `hostname -I` reports `198.19.0.2` — CGNAT space (`198.18.0.0/15`), not
  publicly routable — plus a ULA IPv6 address.
- No `ngrok` / `cloudflared` tunnel is installed; no ports are listening.
- `tailscale` exists, but Tailscale gives a **private-network** address, not a
  public HTTPS URL a judge can open.

So the endpoint **cannot** be served from this VM as a public HTTPS URL. This
submission does not pretend otherwise.

## What would make it live (needs the owner's decision)

1. **Deploy to a free host** (Render / Railway / Fly.io free tier, or any VPS):
   copy `endpoint/` + `src/verify.js`, run `node server.js`, set a cron to
   refresh `state.json` (`node ../src/verify.js --json > endpoint/state.json`
   every 30 min). The host gives the public HTTPS URL.
2. **Cloudflare Tunnel** (`cloudflared`): needs a Cloudflare account; the
   tunnel exposes a local port on a public `*.trycloudflare.com` / custom
   hostname with TLS. Free tier suffices.
3. **Publish the status page as a hosted web app** (e.g. a Muse Space): the
   HTML dashboard could be hosted, but the raw JSON API routes would need a
   backend — evaluate before promising this as the "agent endpoint".

## What a judge can check today without the endpoint

- `src/verify.js` — run it anywhere; it re-checks every balance, owner and
  receipt against public BSC RPCs.
- `evidence/EVIDENCE.md` — every transaction links to BscScan.
- `video/walkthrough.mp4` — narrated walkthrough including real terminal output.

## Attempt log — 15 Nov 2026 ~04:15 WIB (tunnel attempts from this VM)

- **Cloudflare quick tunnel — FAILED.** `cloudflared` 2026.11.0 installed,
  but `api.trycloudflare.com` is blocked by the VM egress proxy (HTTP 403);
  without the proxy there is no direct egress (TLS handshake fails). The
  quick tunnel cannot be created from this VM.
- **SSH tunnel (localhost.run) — NOT POSSIBLE.** Direct SSH is reset by the
  egress proxy; CONNECT to port 22 is refused (HTTP 403). The SSH-based
  tunnel attempt was also declined at confirmation, and was not retried.
- **Local server — RUNNING.** `node server.js 8080` serves `/`, `/status`,
  `/claims`, `/health` on this VM (verified: health OK, POST → 405). Log:
  `/tmp/sandi26-endpoint.log`. It is reachable only inside the VM, not from
  the public internet. Restart after a VM reboot with:
  `cd ~/workspace/agent-games/wildcard/endpoint && node server.js 8080`.
- **Fallback (current): code-only.** The submission ships the endpoint code
  with this honest explanation. To get a public URL, deploy on a free host
  via the browser (Render / Railway / Fly.io free tier, GitHub OAuth) — that
  path needs the owner's browser session, not this VM. Any free-host deploy
  is: copy `endpoint/` + `src/verify.js`, run `node server.js`, refresh
  `state.json` every 30 min (`node ../src/verify.js --json >
  endpoint/state.json`). No paid plan, no card — free tier only.
