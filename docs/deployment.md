# Deployment to GitHub Pages

This document captures the recommended steps to build and deploy the `web-ui` to GitHub Pages for the `clear-loan` repository.

## Overview

- Production build is produced by Vite into `packages/web-ui/dist`.
- GitHub Pages should serve from the `gh-pages` branch (project page) for repository `amritanshvns/clear-loan`.
- Ensure `vite.config.js` uses the correct `base` for production, e.g. `/clear-loan/`.

## Vite base configuration

In `packages/web-ui/vite.config.js` ensure `base` is set for production builds:

```js
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/clear-loan/' : '/',
  // ...other config
});
```

Rebuild after changing `base` so generated `index.html` references `/clear-loan/assets/...`.

## GitHub Actions (recommended)

- The workflow should:
  - checkout the repo
  - install Node (`actions/setup-node`)
  - run `npm ci` at the root
  - run `npm run --workspace packages/web-ui build`
  - publish `packages/web-ui/dist` to `gh-pages` (either via a deployment action or an inline git push)

- If your org blocks third-party actions, prefer an inline deploy step that uses `GITHUB_TOKEN` to push the built files to `gh-pages`.

## Manual deploy (local)

Using the `gh-pages` npm helper (simple):

```bash
npm ci
npm run --workspace packages/web-ui build
npx gh-pages -d packages/web-ui/dist -b gh-pages -r https://github.com/amritanshvns/clear-loan.git
```

Or using an orphan branch (explicit, git):

```bash
npm ci
npm run --workspace packages/web-ui build
git checkout --orphan gh-pages
git --work-tree packages/web-ui/dist add --all
git --work-tree packages/web-ui/dist commit -m "chore: deploy web-ui"
git push -f origin gh-pages
git checkout -
git branch -D gh-pages
```

## Verify deployment

- Visit: `https://amritanshvns.github.io/clear-loan/` and confirm assets load without 404s.
- If assets 404, confirm `dist/index.html` references `/clear-loan/assets/...` and that `gh-pages` branch contains the built files.

## Troubleshooting

- If Actions cannot download a third-party action tarball, either approve that action in the org settings or use an inline deploy step.
- If Actions fail to push due to permission restrictions, ensure `GITHUB_TOKEN` has repository contents: write permission in workflow settings.
- Clear browser caches or test with an incognito window when verifying asset loads after deployment.

## Notes

- This file is intentionally concise — if you want, I can add an example GitHub Actions workflow snippet that performs an inline deploy using `GITHUB_TOKEN`.
