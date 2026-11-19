import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const global = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/global' }),
  schema: z.record(z.string(), z.unknown()),
});

export const collections = { global };