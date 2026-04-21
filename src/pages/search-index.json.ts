import { works } from '../data/catalog';

export const prerender = true;

export async function GET() {
	return new Response(
		JSON.stringify(
			works.map((work) => ({
				slug: work.slug,
				title: work.title,
				author: work.author,
				authorSlug: work.authorSlug,
				snippet: work.snippet,
				qualityLabel: work.qualityLabel,
				searchText: work.cleanedText.slice(0, 12000),
			})),
		),
		{
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		},
	);
}
