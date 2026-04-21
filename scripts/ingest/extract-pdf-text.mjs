import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';

const rootDir = process.cwd();
const inboxDir = path.join(rootDir, 'content', 'pdfs', 'inbox');
const outputDir = path.join(rootDir, 'content', 'works', 'generated');

const slugify = (value) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);

const normalizeText = (text) =>
	text
		.replace(/\r\n/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/-\n(?=[a-z])/g, '')
		.replace(/\n(?=[a-z])/g, ' ')
		.replace(/[ \t]{2,}/g, ' ')
		.trim();

const ensureDirectory = async (dir) => {
	await fs.mkdir(dir, { recursive: true });
};

const collectPdfFiles = async (dir = inboxDir) => {
	await ensureDirectory(dir);
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const nestedFiles = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				return collectPdfFiles(fullPath);
			}

			return entry.isFile() && entry.name.toLowerCase().endsWith('.pdf') ? [fullPath] : [];
		}),
	);

	return nestedFiles.flat();
};

const extractOne = async (filePath) => {
	const buffer = await fs.readFile(filePath);
	const parser = new PDFParse({ data: buffer });
	const parsed = await parser.getText();
	await parser.destroy();
	const normalized = normalizeText(parsed.text ?? '');

	if (!normalized) {
		throw new Error(
			`${path.basename(filePath)} contains no extractable text. This file likely needs an OCR step before it can be turned into a reading edition.`,
		);
	}

	const fileStem = path.basename(filePath, path.extname(filePath));
	const slug = slugify(fileStem);
	const result = {
		slug,
		sourcePdf: path.basename(filePath),
		sourcePath: path.relative(inboxDir, filePath),
		pageCount: parsed.total ?? null,
		extractedAt: new Date().toISOString(),
		text: normalized,
	};

	await ensureDirectory(outputDir);
	await fs.writeFile(path.join(outputDir, `${slug}.json`), `${JSON.stringify(result, null, 2)}\n`);

	return result;
};

const main = async () => {
	const pdfFiles = await collectPdfFiles();

	if (pdfFiles.length === 0) {
		console.log(`No PDFs found in ${path.relative(rootDir, inboxDir)}`);
		return;
	}

	for (const filePath of pdfFiles) {
		const result = await extractOne(filePath);
		console.log(`Extracted ${result.sourcePdf} -> content/works/generated/${result.slug}.json`);
	}
};

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
