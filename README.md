# perduta.github.io

Personal site built with Astro and published at <https://perduta.github.io>.

## Local development

```sh
npm ci
npm run dev
```

The development server is available at <http://localhost:4321>.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the production site in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run astro -- <command>` | Run the Astro CLI |

## Structure

- `src/pages/`: file-based routes
- `src/layouts/`: shared page layouts
- `src/components/`: reusable Astro components
- `src/assets/`: assets processed by Astro
- `public/`: files copied directly to the built site
- `.github/workflows/deploy.yml`: GitHub Pages deployment

## Publishing

Pushes to `master` build and deploy through GitHub Actions. In the GitHub
repository settings, set **Pages > Source** to **GitHub Actions**.

This is a GitHub Pages user site, so Astro is configured with
`site: "https://perduta.github.io"` and no `base` path.
