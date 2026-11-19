import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const global = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/global' }),
  schema: z.record(z.string(), z.unknown()),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.record(z.string(), z.unknown()),
});

const category = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/category' }),
  schema: z.record(z.string(), z.unknown()),
});

const page = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/page' }),
  schema: z.record(z.string(), z.unknown()),
});

const user = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/user' }),
  schema: z.record(z.string(), z.unknown()),
});

export const collections = { global, blog, category, page, user };