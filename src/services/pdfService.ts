import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromFile(file: File): Promise<{
  text: string;
  pageCount: number;
}> {
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')) {
    return {
      text: await file.text(),
      pageCount: 1,
    };
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF, TXT, and Markdown files are supported right now.');
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      pages.push(`Page ${pageNumber}\n${pageText}`);
    }
  }

  return {
    text: pages.join('\n\n'),
    pageCount: pdf.numPages,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractConceptTags(text: string, fallback: string): string[] {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !commonWords.has(word.toLowerCase()));

  const counts = new Map<string, number>();
  words.forEach(word => {
    const key = word.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const tags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word.replace(/^\w/, char => char.toUpperCase()));

  return tags.length ? tags : [fallback, 'Exam Notes', 'Important Concepts'];
}

const commonWords = new Set([
  'about',
  'above',
  'after',
  'again',
  'because',
  'between',
  'chapter',
  'could',
  'first',
  'following',
  'from',
  'should',
  'their',
  'there',
  'these',
  'through',
  'using',
  'where',
  'which',
  'while',
  'would',
]);
