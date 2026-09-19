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

`site.url` is set to `https://aashutosh-dabhade.github.io`, which drives the
canonical tags, social-share previews and `sitemap.xml`. Change it if you move
to your own domain.

Two things still worth doing:

1. **`site.formEndpoint`** — empty, so the contact form falls back to the
   visitor's email client. See *Contact form* below.
2. **Gallery videos** — the 11 Google Drive links do not play for visitors and
   should be moved to YouTube. See *Gallery videos* below.

## Gallery videos

The gallery reads `gallery[].videoUrl` from `data/content.json`. The player
accepts YouTube, Vimeo, a direct `.mp4`/`.webm` URL, or Google Drive.

**Google Drive does not work for this.** The files are shared correctly
(*Anyone with the link*), but Drive's own player returns *"Could not preview
the file — There was a problem playing this video"* for signed-out visitors.
It looks fine while you are logged in as the owner and fails for everyone else.
That is Drive's streaming behaviour, not a site bug, and no sharing setting
fixes it.

**Use YouTube instead.** Upload each video as **Unlisted** — not indexed, not
listed on your channel, playable by anyone with the link — and paste the watch
URL into `videoUrl`:

```json
{ "id": "absa-1", "title": "…", "videoUrl": "https://www.youtube.com/watch?v=XXXXXXXXXXX" }
```

Nothing else changes; the player detects the host automatically. Vimeo and
self-hosted MP4s work the same way, though a large MP4 committed to the repo
counts against the 1 GB GitHub Pages limit.

Whatever the source, the lightbox shows an **"Open it directly"** link beneath
the player, so a failed embed still leaves the visitor a working route to the
video.

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

## Hosting — this site runs on GitHub Pages

Live at **<https://aashutosh-dabhade.github.io>**, published from the
`Aashutosh-Dabhade.github.io` repo by `.github/workflows/deploy.yml`.

Push to `main` and it redeploys. Nothing to build or upload by hand:

```bash
git add -A && git commit -m "Update content" && git push
```

One-time setup, if the repo is new: create it on GitHub as
`Aashutosh-Dabhade.github.io` (public), push, then **Settings → Pages →
Source: GitHub Actions**. First deploy takes about a minute.

Note that GitHub Pages ignores `static/_headers`, so the caching and security
headers in it do nothing here. They apply if you ever move to Netlify or
Cloudflare Pages. Everything else works identically.

### Moving to a custom domain later

Three steps, about two minutes:

1. Set `site.url` in `data/content.json` to `https://yourdomain.com` and commit.
   That updates the canonical tags, OG image URLs and `sitemap.xml`.
2. Add `yourdomain.com` under **Settings → Pages → Custom domain**. GitHub
   writes a `CNAME` file into the repo for you.
3. At your registrar, point the domain at GitHub:
   - `www` → CNAME to `aashutosh-dabhade.github.io`
   - apex (`yourdomain.com`) → four A records at `185.199.108.153`,
     `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (confirm these against the values GitHub shows you — they do change)

Tick **Enforce HTTPS** once the certificate provisions, usually within the hour.

### Other hosts

Configs for all of these are already in the repo if you ever switch — each
auto-detects build `node build.mjs`, output `dist`.

| Host | Cost | Notes |
| --- | --- | --- |
| **Cloudflare Pages** | Free, unlimited bandwidth | The one to move to if you outgrow Pages: private repos allowed, honours `_headers`. |
| **Netlify** | Free (100 GB/mo) | `netlify.toml` is here. Form handling built in. |
| **Vercel** | Free (100 GB/mo) | `vercel.json` is here. Free tier is non-commercial. |

**A domain is the only real expense.** A `.com` runs roughly ₹1,000–1,300
(~$12–15) per year at Cloudflare Registrar (sold at cost, no markup),
Namecheap or Porkbun. `.dev` and `.io` cost more; `.in` is usually cheaper.
So: **₹0 hosting + ~₹1,200/year if and when you want your own domain.**

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
