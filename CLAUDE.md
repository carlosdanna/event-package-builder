# Event Package Builder

Technical interview project for Proposales, a proposal tool for hotel sales teams.

## What it does
A hotel salesperson picks an event template, enters guest count and dates,
adjusts a suggested package with a live price total, adds customer details,
and creates a draft proposal in Proposales with one click.

## Stack (fixed)
- Node.js version pinned in .nvmrc, pnpm as the package manager (never npm or yarn)
- Next.js App Router with TypeScript, deployed on Vercel
- shadcn components
- TanStack Query for all client data fetching and mutations
- Zod for every schema (templates, wizard steps, route input, outside responses)
- Proposales developer interface, version 3: https://api.proposales.com/v3,
  bearer token. Docs: https://docs.proposales.com/introduction
- No language model. All logic is plain, tested code.

## Hard rules
- PROPOSALES_API_KEY is read only on the server, from environment variables.
  Never expose it to the browser, never prefix it with NEXT_PUBLIC.
- APP_PASSWORD (the shared sign-in password) is also read only on the server.
  proxy.ts requires the session cookie for every page and route handler except
  /login and /api/session.
- The browser only calls this app's own route handlers.
- lib/proposales imports "server-only".
- All pricing and quantity logic lives in lib/package as pure functions,
  shared by the browser (live summary) and the server (recalculated before
  creating the draft). Never trust totals sent from the browser.
- Prices are integers in the smallest unit of their currency (öre, cents, pence).
  Each catalog item has its own price per currency in lib/catalog/metadata.ts;
  there are no exchange rates. Format with formatMoney only in the interface.
- Meeting spaces, rooms and equipment have a physical limit (`available` in
  lib/catalog/metadata.ts); catering has none. A package over a limit, or with
  a space too small for the guests, cannot be created (checked in the browser
  and again on the server with packageIssues).
- Nothing is written to Proposales without an explicit user confirm.

## Pricing units
- per_person: guests
- per_person_per_day: guests × days
- per_room_per_night: rooms × nights
- per_day: days
- flat: 1
Days = end date minus start date plus 1. Nights = days minus 1, but at least 1
when the package includes rooms (guests stay the night after a one-day event).

## Templates
Full-day conference, wedding, team offsite, private dinner, product launch.
Each defines event type, default items by content title, and a rooms rule.

## Folder layout
- app/ page, layout, error screen and login page only
- app/api/content, app/api/proposals, app/api/session route handlers
- proxy.ts sign-in check in front of every request
- features/wizard (wizard, reducer, steps/, summary.tsx, done screen),
  features/drafts (create and list drafts), features/catalog, features/auth
  (login form, sign out), features/shared
- components/ui shadcn components, components/ app-wide providers and theme toggle
- lib/proposales, lib/package, lib/templates, lib/catalog, lib/schemas, lib/auth
- scripts/seed.ts

## Commits
- Conventional Commits only (feat, fix, chore, docs, refactor, test, and so on),
  enforced by a commitlint commit-msg hook. Never bypass it with --no-verify.

## Style
- Small, readable functions. No clever abstractions.
- Text styles go through Typography (components/ui/typography.tsx): pick the
  tag with `as`, adjust with size, weight and color, and use className for the rest.
- Avoid acronyms in user-facing text and in comments.
- Tests with Vitest. No live outside calls in tests.
