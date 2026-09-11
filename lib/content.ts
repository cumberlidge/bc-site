/**
 * Content layer for bc-site
 *
 * Reads and validates MDX files from /content directory.
 * Validates frontmatter against a Zod discriminated union based on content type.
 *
 * Invalid frontmatter will fail the build with:
 * - The filename where the error occurred
 * - The specific field that failed validation
 * - A descriptive error message
 *
 * Usage:
 *   import { getAllEntries, type Entry } from '@/lib/content';
 *
 *   const entries = getAllEntries(); // Returns Entry[], sorted by date descending, drafts excluded
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

// Shared fields for all types
const baseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['essay', 'fiction', 'note', 'project']),
  slug: z.string(),
  draft: z.boolean().optional().default(false),
  summary: z.string().optional(),
});

// Optional external publication fields for essay and fiction
const externalPublicationSchema = z.object({
  externalUrl: z.string().optional(),
  externalSource: z.string().optional(),
});

// Essay schema
const essaySchema = baseSchema.extend({
  type: z.literal('essay'),
  title: z.string(),
}).merge(externalPublicationSchema);

// Fiction schema
const fictionSchema = baseSchema.extend({
  type: z.literal('fiction'),
  title: z.string(),
}).merge(externalPublicationSchema);

// Note schema - title must be absent
// Using strict() ensures no additional fields like title are allowed
const noteSchema = baseSchema
  .extend({
    type: z.literal('note'),
  })
  .strict();

// Project schema
const projectSchema = baseSchema.extend({
  type: z.literal('project'),
  title: z.string(),
  repoUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  stack: z.array(z.string()).optional(),
});

// Discriminated union on type
export const entrySchema = z.discriminatedUnion('type', [
  essaySchema,
  fictionSchema,
  noteSchema,
  projectSchema,
]);

export type Entry = z.infer<typeof entrySchema>;
export type Essay = z.infer<typeof essaySchema>;
export type Fiction = z.infer<typeof fictionSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Project = z.infer<typeof projectSchema>;

// Extended entry type with content body
export type EntryWithContent = Entry & {
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Extracts the first line from markdown content and truncates it at maxLength.
 * Used for displaying notes in the index.
 */
export function getFirstLine(content: string, maxLength: number = 60): string {
  const firstLine = content.trim().split('\n')[0];
  if (firstLine.length <= maxLength) {
    return firstLine;
  }
  return firstLine.slice(0, maxLength);
}

/**
 * Reads all MDX files from /content, parses frontmatter, validates with Zod,
 * and returns entries sorted by date descending, excluding drafts.
 */
export function getAllEntries(): EntryWithContent[] {
  // Check if content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(`Content directory not found at ${CONTENT_DIR}`);
  }

  const files = fs.readdirSync(CONTENT_DIR);
  const mdxFiles = files.filter(file => file.endsWith('.mdx'));

  const entries: EntryWithContent[] = [];

  for (const filename of mdxFiles) {
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent, {
      // Prevent gray-matter from parsing dates as Date objects
      engines: {
        yaml: (s) => require('js-yaml').load(s, { schema: require('js-yaml').JSON_SCHEMA }) as object
      }
    });

    try {
      const validatedEntry = entrySchema.parse(data);
      entries.push({
        ...validatedEntry,
        content,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.issues.map(err => {
          const field = err.path.join('.');
          return `  - ${field}: ${err.message}`;
        }).join('\n');

        throw new Error(
          `Invalid frontmatter in ${filename}:\n${fieldErrors}`
        );
      }
      throw error;
    }
  }

  // Filter out drafts
  const publishedEntries = entries.filter(entry => !entry.draft);

  // Sort by date descending
  publishedEntries.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return publishedEntries;
}
