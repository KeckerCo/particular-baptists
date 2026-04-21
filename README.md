# Particular Baptists Library

A searchable digital library of historical Particular Baptist writings — sermons, confessions, and treatises from the 17th and 18th centuries. An [IRBS](https://irbs.org) project.

**Live site:** https://particularbaptists.kecker.co

## Stack

- Astro 5 (fully static, all pages pre-rendered)
- Cloudflare Pages hosting
- Client-side full-text search (`/search-index.json`)
- EB Garamond + Inter typography, minimalist IRBS design system
- 212 works by 31 historical Particular Baptist authors (pre-1900)

## Project structure

```text
├── content/
│   ├── pdfs/
│   │   └── inbox/          # drop source PDFs here (gitignored)
│   └── works/
│       └── generated/      # extracted text JSON files (212 works)
├── scripts/
│   └── ingest/             # PDF text extraction scripts
├── src/
│   ├── components/         # Header, Footer, SiteShell
│   ├── data/               # catalog.ts — all data logic
│   ├── pages/              # index, search, authors, works, about
│   └── styles/             # global.css design system
├── public/                 # irbs-wordmark.svg, irbs-shield.svg, favicon
└── .github/workflows/      # deploy.yml — CI/CD to Cloudflare Pages
```

## Local development

```sh
npm install
npm run dev
```

To preview the production build locally:

```sh
npm run build
python3 -m http.server 8899 -d dist
# open http://localhost:8899/index.html
```

## Deployment

Every push to `main` automatically deploys to Cloudflare Pages via GitHub Actions.

### One-time setup: add the Cloudflare API token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** → use the **"Edit Cloudflare Pages"** template
3. Add the token as a GitHub secret:

```sh
gh secret set CLOUDFLARE_API_TOKEN --repo KeckerCo/particular-baptists
```

The `CLOUDFLARE_ACCOUNT_ID` variable is already set in the repo.

## Adding PDFs

Drop source facsimile PDFs into `content/pdfs/inbox/` (gitignored) then run:

```sh
npm run ingest:pdfs
```

Extracted text goes to `content/works/generated/` and is committed to the repo.

## Design system

- Primary color: `#9c182f` (IRBS maroon)
- Serif: EB Garamond (headings, body)
- UI: Inter (labels, navigation, metadata)
- No shadows, no card fills — 1px ruled lines for separation
- `border-radius: 6px` on interactive elements, `10px` on grid containers
