import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    topic: z.string(),
    // name of the media-panel widget shown on the index; omit for the default placeholder
    widget: z.string().optional(),
  }),
});

export const collections = { posts };
