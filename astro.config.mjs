// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.perduta.net',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
});
