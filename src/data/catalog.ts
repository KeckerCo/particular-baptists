import fs from 'node:fs';
import path from 'node:path';

export type CatalogWork = {
	slug: string;
	title: string;
	author: string;
	authorSlug: string;
	sourcePdf: string;
	sourcePath: string;
	pageCount: number | null;
	extractedAt: string;
	text: string;
	cleanedText: string;
	sampleText: string[];
	snippet: string;
	wordCount: number;
	isThinExtraction: boolean;
	qualityLabel: 'text-rich' | 'needs-ocr';
};

export type CatalogAuthor = {
	name: string;
	slug: string;
	works: CatalogWork[];
	summary: string;
};

type GeneratedWorkRecord = {
	slug: string;
	sourcePdf: string;
	sourcePath: string;
	pageCount: number | null;
	extractedAt: string;
	text: string;
};

const generatedDir = path.join(process.cwd(), 'content', 'works', 'generated');
const pageMarkerPattern = /--\s*\d+\s+of\s+\d+\s*--/gi;
const containerNames = new Set([
	'Particular Baptists',
	'Other baptist things',
	'Jim Renihan Particular Baptist PDFs',
	'breakers',
	'photos',
	'New folder',
	'Folder New',
	'Theological Writings',
	'Writings Theological',
	'Best',
]);

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 100);

const titleCase = (value: string) =>
	value
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');

const normalizeAuthorName = (value: string) => {
	const cleaned = value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

	if (!cleaned) {
		return 'Unknown author';
	}

	// Folders named "Last, First" (comma-separated) — the standard format for person folders
	if (cleaned.includes(',')) {
		const [last, first] = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
		return [first, last].filter(Boolean).join(' ');
	}

	// All other names (organizations, single-word, multi-word) — return as-is

	return cleaned;
};

const fallbackAuthorFromPdf = (sourcePdf: string) => {
	const prefix = (sourcePdf.split('-')[0] ?? sourcePdf).replace(/\.pdf$/i, '');
	// PDF filenames use "LastName_FirstName" convention — reverse to "First Last"
	if (prefix.includes('_')) {
		const [last, first] = prefix.split('_').map((p) => p.trim());
		return [first, last].filter(Boolean).join(' ');
	}
	return normalizeAuthorName(prefix);
};

const deriveAuthor = (sourcePath: string, sourcePdf: string) => {
	const segments = sourcePath.split('/').filter(Boolean);
	const parent = segments.at(-2) ?? '';

	if (parent === '1644 Confession') {
		return '1644 Confession';
	}

	if (parent && !containerNames.has(parent)) {
		return normalizeAuthorName(parent);
	}

	return fallbackAuthorFromPdf(sourcePdf);
};

const deriveTitle = (sourcePdf: string) => {
	const withoutExtension = sourcePdf.replace(/\.pdf$/i, '');
	const afterDash = withoutExtension.includes('-') ? withoutExtension.split('-').slice(1).join('-') : withoutExtension;
	const withoutWing = afterDash.replace(/-Wing-[^-]+.*$/i, '');
	const normalized = withoutWing
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/\s+\(\d+\)$/, '')
		.replace(/\b[pP]\d+to\d+\b/g, '')
		.trim();

	return titleCase(normalized || withoutExtension.replace(/[_-]+/g, ' '));
};

const cleanExtractedText = (text: string) =>
	text
		.replace(/\u0000/g, '')
		.replace(pageMarkerPattern, '')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

const splitParagraphs = (text: string) =>
	text
		.split(/\n\s*\n/g)
		.map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
		.filter((paragraph) => paragraph.length > 40 && !/^[-\d\s.]+$/.test(paragraph));

const authorBios: Record<string, string> = {
	'Benjamin Keach': "Baptist minister and prolific author (1640\u20131704), known for championing congregational hymn-singing and writing extensively on Reformed Baptist theology.",
	'John Tombes': "Puritan minister (1602\u20131676) who became a leading defender of believer's baptism, engaging Presbyterians in print throughout the Interregnum.",
	'Hanserd Knollys': "One of the founders of Particular Baptist church life in London (1599\u20131691), a signatory to the 1644 and 1689 Confessions.",
	'William Kiffin': "Prominent London merchant and Baptist elder (1616\u20131701), a key figure in early Particular Baptist life and a signatory of both major Confessions.",
	'Hercules Collins': "London Baptist pastor (c.1647\u20131702), best known for adapting the Heidelberg Catechism for Baptist use.",
	'John Gill': "Particular Baptist minister and theologian (1697\u20131771), whose exhaustive commentaries and systematic theology shaped 18th-century Baptist thought.",
	'Thomas De Laune': "Baptist minister and apologist (1635\u20131685) who died in Newgate Prison for his faith, author of a widely read defence of Baptist principles.",
	'John Collett Ryland': "Particular Baptist pastor (1723\u20131792) and father of John Ryland Jr., active in the Baptist revival of the late 18th century.",
	'Christopher Blackwood': "Puritan minister (d. 1670) who embraced Baptist convictions during the 1640s and wrote several defences of believer's baptism.",
	'Charles Marie De Veil': "French Protestant scholar (1639\u20131685) who converted to Christianity and translated commentaries on the New Testament used by Baptist readers.",
	'Benjamin Wallin': "London Baptist minister (1711\u20131782), pastor of Maze Pond and author of devotional and doctrinal works.",
	'Benjamin Harris': "Baptist printer and publisher (c.1647\u20131720), significant for distributing Nonconformist and Baptist literature in England and colonial America.",
	'Maria De Fleury': "Congregationalist hymn writer (c.1750\u2013c.1794) whose sacred poetry and hymns circulated widely among Nonconformists.",
	'Anthony Palmer': "Early Particular Baptist elder active in the mid-17th century, associated with the London gathered churches.",
	'Isaac Backus': "American Baptist minister and historian (1724\u20131806), a tireless advocate for religious liberty in New England.",
	'Nehemiah Coxe': "London Baptist minister (d. 1688) and a principal editor of the 1689 Second London Confession, also wrote on covenant theology.",
	'Paul Hobson': "Particular Baptist officer and minister (fl. 1645\u20131666), active in the Parliamentary army and in gathered churches.",
	'John Rippon': "Baptist minister and editor (1751\u20131836), pastor of Carter Lane, London, and editor of the influential Baptist Register.",
	'Andrew Fuller': "Particular Baptist minister and theologian (1754\u20131815), chief architect of the moderate Calvinist theology that energised the modern missionary movement.",
	'Andrew Ritor': "Mid-17th-century Baptist controversialist, known for writings defending Baptist practices against Presbyterian critics.",
	'Edward Hutchinson': "London Baptist minister (fl. 1670s), wrote on covenant theology from a Particular Baptist perspective.",
	'Elias Keach': "Baptist minister in America (1665\u20131701) and son of Benjamin Keach, founder of several churches in Pennsylvania.",
	'Henry Dunster': "First president of Harvard College (1609\u20131659) who adopted Baptist convictions and was forced to resign his post.",
	'John Clarke': "Founder of Newport, Rhode Island (1609\u20131676), Baptist minister, physician, and colonial charter advocate for religious freedom.",
	'John Jr. D.D Ryland': "Particular Baptist minister (1753\u20131825), pastor at Broadmead Bristol and first president of Serampore College in India.",
	'John Quincy Adams': "Baptist minister and polemicist who wrote on Baptist church order and ordinances.",
	'John Spilsbury': "First pastor of the first Particular Baptist church in England (c.1593\u2013c.1668), a foundational figure in Baptist origins.",
	'Robert Boyte C Howell': "American Baptist minister (1801\u20131868), president of the Southern Baptist Convention and pastor in Nashville.",
	'Thomas Patient': "Particular Baptist minister active in Ireland and England (fl. 1640\u20131666), wrote in defence of believer's baptism.",
	'Edward Harrison': "Baptist minister active in the mid-17th century.",
	'General Assemblies': "Records and narratives from the General Assemblies of Particular Baptist churches in 17th and 18th-century England.",
	'1644 Confession': "The First London Confession of Faith (1644), the foundational doctrinal statement of seven Particular Baptist churches in London.",
};

const createAuthorSummary = (author: string, worksCount: number) =>
	authorBios[author] ??
	`${author} — ${worksCount} work${worksCount === 1 ? '' : 's'} in the library.`;

const getRawCatalogWorks = (): CatalogWork[] => {
	if (!fs.existsSync(generatedDir)) {
		return [];
	}

	return fs
		.readdirSync(generatedDir)
		.filter((file) => file.endsWith('.json'))
		.map((file) => {
			const raw = JSON.parse(
				fs.readFileSync(path.join(generatedDir, file), 'utf8'),
			) as GeneratedWorkRecord;
			const author = deriveAuthor(raw.sourcePath, raw.sourcePdf);
			const authorSlug = slugify(author);
			const title = deriveTitle(raw.sourcePdf);
			const cleanedText = cleanExtractedText(raw.text ?? '');
			const sampleText = splitParagraphs(cleanedText).slice(0, 16);
			const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
			const isThinExtraction = cleanedText.length < 500 || sampleText.length === 0;
			const snippet =
				sampleText[0] ??
				'This work is available as a historical scan. Full-text search will be enabled as transcription progresses.';

			return {
				slug: raw.slug,
				title,
				author,
				authorSlug,
				sourcePdf: raw.sourcePdf,
				sourcePath: raw.sourcePath,
				pageCount: raw.pageCount ?? null,
				extractedAt: raw.extractedAt,
				text: raw.text ?? '',
				cleanedText,
				sampleText,
				snippet,
				wordCount,
				isThinExtraction,
				qualityLabel: isThinExtraction ? 'needs-ocr' : 'text-rich',
			} satisfies CatalogWork;
		})
		.sort((a, b) => a.title.localeCompare(b.title));
};

const catalogWorks = getRawCatalogWorks();

const authorMap = new Map<string, CatalogWork[]>();
for (const work of catalogWorks) {
	const bucket = authorMap.get(work.authorSlug) ?? [];
	bucket.push(work);
	authorMap.set(work.authorSlug, bucket);
}

const catalogAuthors: CatalogAuthor[] = Array.from(authorMap.entries())
	.map(([slug, works]) => ({
		slug,
		name: works[0]?.author ?? 'Unknown author',
		works: works.sort((a, b) => a.title.localeCompare(b.title)),
		summary: createAuthorSummary(works[0]?.author ?? 'Unknown author', works.length),
	}))
	.sort((a, b) => a.name.localeCompare(b.name));

const richWorks = catalogWorks.filter((work) => !work.isThinExtraction);

// Works with real titles (not bare catalog numbers like "1 028", "5 214", "57.2 ...")
// Sorted longest-title-first for better featured display
const properTitleWorks = richWorks
	.filter(
		(work) =>
			work.title.length > 20 &&
			!/^[\d\s.]+$/.test(work.title.trim()) &&
			!/^\d/.test(work.title.trim()) &&
			work.title.split(' ').length >= 4
	)
	.sort((a, b) => b.title.length - a.title.length);

export const works = catalogWorks;
export const authors = catalogAuthors;
export const authorAlphabet = Array.from(new Set(catalogAuthors.map((author) => author.name.charAt(0).toUpperCase()))).sort();
export const featuredWorks = properTitleWorks.slice(0, 6);
export const featuredSearchResults = properTitleWorks.slice(0, 6).map((work) => ({
	title: work.title,
	slug: work.slug,
	snippet: work.snippet,
	author: work.author,
}));
export const catalogStats = {
	totalWorks: works.length,
	totalAuthors: authors.length,
	textRichWorks: richWorks.length,
	needsOcrWorks: works.filter((work) => work.isThinExtraction).length,
};

export const getAuthorBySlug = (slug: string) => authors.find((author) => author.slug === slug);
export const getWorkBySlug = (slug: string) => works.find((work) => work.slug === slug);
export const getWorksByAuthor = (authorSlug: string) => works.filter((work) => work.authorSlug === authorSlug);

export const searchWorks = (query: string) => {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return featuredSearchResults;
	}

	const matches = works
		.filter((work) => {
			const haystack = `${work.title} ${work.author} ${work.cleanedText}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		})
		.slice(0, 12)
		.map((work) => ({
			title: work.title,
			slug: work.slug,
			snippet: work.snippet,
			author: work.author,
		}));

	return matches.length > 0 ? matches : featuredSearchResults;
};
