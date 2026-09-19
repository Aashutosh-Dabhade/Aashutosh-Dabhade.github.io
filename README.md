# Aashutosh Dabhade — Portfolio

A self-contained static clone of the Readdy-hosted portfolio, rebuilt as plain
HTML/CSS/JS with no runtime framework and no external CDN dependency for content.
All images are stored locally, so the site keeps working if readdy.ai ever goes away.

```
build.mjs               generator — turns data/content.json into dist/
serve.mjs               tiny local preview server
data/content.json       ALL site content (text, links, projects, skills, videos)
static/                 copied verbatim into dist/
  assets/css/styles.css
  assets/js/main.js
  assets/img/           30 local images
dist/                   generated output — this is what you deploy
```

## Run it locally

```bash
npm run dev
```

Then open <http://localhost:4173>. `npm run build` alone just regenerates `dist/`.
Node 18+ required; there are no npm dependencies to install.

## Editing content

Almost everything lives in `data/content.json` — headline copy, stats, expertise
accordion, case studies, work history, skill percentages, blog cards, gallery
videos and contact details. Change a value, run `npm run build`, done.

Three things you should set before going live:

1. **`site.url`** — your real domain (e.g. `https://aashutoshdabhade.com`).
   Setting it switches on `sitemap.xml`, `robots.txt` and canonical/OG tags.
2. **`site.formEndpoint`** — see *Contact form* below.
3. **Gallery videos** — the 11 Google Drive files must be shared as
   *Anyone with the link → Viewer*, or the embedded player shows a blank frame.

## Contact form

`site.formEndpoint` is empty by default, so the form falls back to opening the
visitor's email client with the answers pre-filled. That works everywhere but is
clunky. For real submissions, paste an endpoint from a free form service:

| Service | Free tier | Endpoint format |
| --- | --- | --- |
| [Web3Forms](https://web3forms.com) | 250 submissions/month, no account | `https://api.web3forms.com/submit` (+ add your access key as a hidden input) |
| [Formspree](https://formspree.io) | 50 submissions/month | `https://formspree.io/f/xxxxxxx` |
| [Netlify Forms](https://docs.netlify.com/forms/setup/) | 100 submissions/month | Netlify-only; add `netlify` + `name` attributes to the `<form>` |

The form already includes a `_gotcha` honeypot field that these services use for
spam filtering.

## Hosting

The output is static files, so every option below serves it well. Ranked by what
I'd actually pick:

| Host | Cost | Custom domain | Notes |
| --- | --- | --- | --- |
| **Cloudflare Pages** | Free, unlimited bandwidth | Free, free SSL | Best free tier by a distance. 500 builds/month. Git push deploys. |
| **Netlify** | Free (100 GB/mo) | Free, free SSL | Easiest UI; `netlify.toml` is already here. Form handling built in. |
| **Vercel** | Free (100 GB/mo) | Free, free SSL | `vercel.json` is already here. Free tier is non-commercial. |
| **GitHub Pages** | Free | Free, free SSL | Workflow in `.github/workflows/deploy.yml`. No server-side anything. |

All four give you free HTTPS and deploy automatically when you push to `main`.

**Domain cost is the only real expense.** A `.com` runs roughly ₹1,000–1,300
(~$12–15) per year at Cloudflare Registrar (sold at cost, no markup),
Namecheap or Porkbun. `.dev` and `.io` cost more; `.in` is usually cheaper.
So: **₹0 hosting + ~₹1,200/year for the domain.**

### Deploying to Cloudflare Pages (recommended)

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build command `node build.mjs`, output directory `dist`.
4. Custom domains → add your domain. If the domain is registered at Cloudflare
   the DNS is wired up for you; otherwise point the nameservers there first.

### Deploying to Netlify or Vercel

Connect the repo — both auto-detect the config files in this folder. Add the
domain under *Domain settings* / *Domains*, then set the registrar's records to
what they show you.

### Deploying to GitHub Pages

Push to `main`, then repo *Settings → Pages → Source: GitHub Actions*. For a
custom domain, add it under the same settings page and create a `CNAME` record
at your registrar pointing to `<username>.github.io`.

## Differences from the original

- Case study pages for **AI Banking Kiosk**, **ONGC VR Safety Training** and
  **Virtual Darshan Platform** show a short placeholder. The original site has no
  content for these three — clicking them there returns "Case Study Not Found".
  Add `details` entries in `data/content.json` (copy the shape of an existing one)
  to turn them into full write-ups.
- The two SBI Life case-study screenshots were dead on the source (its image API
  returns "hash not found"), so that page reuses the SBI card and gallery images.
- The Readdy watermark and "Get one for FREE" banner are gone.
- Content reachable only by JavaScript on the original — the counters, skill bars
  and section reveals — is now in the HTML, so it survives a failed script and is
  visible to search engines.
- Blog cards are not links; the original had no article pages behind them.
