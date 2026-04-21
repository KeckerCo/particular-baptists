// @ts-check

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
const site = process.env.SITE_URL ?? 'https://particularbaptists.irbs.org';

export default defineConfig({
	site,
	output: 'server',
	adapter: cloudflare(),
	integrations: [mdx(), sitemap()],
});
