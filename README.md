# Particular Baptists Library

An IRBS-branded Cloudflare site for historical Particular Baptist resources, built around a search-first experience, author navigation, and mobile-first long-form reading over extracted PDF content.

## Stack

- Astro with the Cloudflare adapter
- Cloudflare Workers + Wrangler
- Cloudflare D1 schema for metadata and search chunks
- Local PDF ingestion workflow with `pdf-parse`
- Custom editorial design system tuned for mobile reading
- Search-first IA with author browse as a top-level navigation path

## 🚀 Project Structure

```text
├── content/
│   ├── pdfs/
│   │   ├── inbox/       # drop raw source PDFs here
│   │   └── tmp/         # transient extraction artifacts
│   └── works/
│       └── generated/   # normalized output from ingestion scripts
├── db/
│   └── schema.sql       # D1 metadata + FTS schema
├── scripts/
│   └── ingest/          # PDF extraction and normalization
├── src/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   └── styles/
└── wrangler.jsonc
```

## Local development

```sh
npm install
npm run dev
```

For Cloudflare-local development:

```sh
npm run build
npm run dev:cf
```

## PDF inbox

Put source facsimile PDFs here:

```text
content/pdfs/inbox/
```

That folder is already gitignored except for its `.gitkeep`, so you can copy files there without adding them to Git.

## Ingestion

Extract raw text from PDFs currently in the inbox:

```sh
npm run ingest:pdfs
```

Output goes to:

```text
content/works/generated/
```

The first script handles text-based PDFs now and fails explicitly for image-only scans so OCR can be added as the next step instead of silently producing bad output.

## Information architecture

- **Primary experience:** search
- **Primary browse path:** authors
- **Secondary browse path:** works
- **Reading model:** editorial web editions instead of embedded PDF viewers

## Search storage

`db/schema.sql` contains the starting D1 schema:
- works metadata
- sections
- search chunks
- FTS index

## Deployment notes

1. Create a D1 database and update `wrangler.jsonc`.
2. Set `SITE_URL` for the production domain if needed.
3. Build with `npm run build`.
4. Deploy with Wrangler.
