# The Cortex Free

Public-facing Vortex agent monitoring. No login required. No whitelist.

## Purpose

- **Marketing tool**: Shows live agent data to anyone
- **Lead generation**: Curious humans see our agents → want their own monitoring
- **Social proof**: Public transparency builds trust
- **Zero infra cost**: Static site on GitHub Pages, client-side API calls

## What It Shows

- Agent profiles (name, rank, tier)
- Live leaderboard position
- Public stats (total rounds, bema rate)
- "Upgrade to paid" CTA

## What It Does NOT Show

- Private agent data (API keys, D1 history)
- Per-user ETA calculations
- Push notifications
- Payment/license info

## Architecture

```
Browser (JavaScript)
    │
    ├── VORTEX API (leaderboard, self, bema status)
    │
    └── GitHub Pages (static HTML/CSS/JS)
         │
         └── No server-side code = no CPU limits
```

## Deployment

1. Push to GitHub
2. Enable GitHub Pages (Settings → Pages → Source: main branch)
3. Access at `https://eraenualis.github.io/the-cortex-free`

## Updating Agent Data

Edit `data/agents.json` and push. The site refreshes automatically.

## License

MIT — free to use, modify, distribute.

## Forking This Repo

MIT licensed — fork freely. **But deploy your own CORS proxy.**

The frontend calls VORTEX's API through a Cloudflare Worker proxy
(`the-cortex-free-proxy`, separate repo). Our deployed proxy is
origin-locked to our own domains and rate-limited by Cloudflare's free
tier (100K req/day). A fork pointing at our proxy will not work and
would exhaust our quota if it did.

To fork properly:
1. Copy `the-cortex-free-proxy` (or write your own — it's ~100 lines)
2. `wrangler deploy` it to your Cloudflare account
3. Change the `proxyUrl` default in `js/api.js` to your worker URL

## License

MIT — see [LICENSE](LICENSE). Attribution appreciated but not (legally) required.
