# Event Package Builder

A hotel salesperson picks an event template, adjusts a suggested package with a
live price total, and creates a draft proposal in Proposales.

## Getting started

Node.js version is pinned in `.nvmrc`. The package manager is pnpm.

```bash
nvm use
corepack enable        # makes the pinned pnpm version available
pnpm install
cp .env.example .env.local   # then fill in PROPOSALES_API_KEY
pnpm dev
```

## Scripts

- `pnpm dev`: development server
- `pnpm build`: production build
- `pnpm lint`: ESLint
- `pnpm test`: Vitest
- `pnpm seed`: creates or updates the catalog content in Proposales (`--cleanup` archives it). Prices, units and categories live in `lib/catalog/metadata.ts`, because Proposales content cannot store them.

## Commits

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org),
for example `feat: add template picker` or `fix(package): round nights up`.
A `commit-msg` hook (husky and commitlint) rejects anything else. It is
installed by `pnpm install`.
