# OpenLoan [![Deploy web-ui to gh-pages](https://github.com/amritanshvns/clear-loan/actions/workflows/deploy.yml/badge.svg)](https://github.com/amritanshvns/clear-loan/actions/workflows/deploy.yml)

OpenLoan is an offline-first, privacy-first loan calculation and simulation platform. 

Repository structure (monorepo):

- `packages/core-engine` — Pure financial calculation engine (TypeScript).
- `packages/web-ui` — React + Vite browser application shell.

Documentation and planning

- See the `docs/` folder for design, requirements, security, and backlog artifacts.
- Active implementation backlog: `docs/task.md`.

Getting started (development)

1. Install Node.js 18+ and npm.
2. From the repository root run:

```bash
npm ci
npm run --workspace packages/web-ui dev
```

Build (production)

```bash
npm ci
npm run --workspace packages/web-ui build
```

Deployment

- CI builds `packages/web-ui` and deploys `packages/web-ui/dist` to the `gh-pages` branch via `.github/workflows/deploy.yml`.

Contributing

- See `docs/` for design and requirement documents, and `task.md` for the current backlog and next steps.
