# Event Package Builder

## What it does

A hotel salesperson picks the currency and an event template, enters the guest count and dates, and adjusts a suggested package while a live total updates beside it. After adding the customer's details and confirming, one click creates a draft proposal in Proposales with every line priced.

![Screenshot of the wizard](docs/screenshot.png)

## Running locally

You need the Node.js version in `.nvmrc` and pnpm (the version is pinned in `package.json`).

```bash
nvm use
corepack enable              # makes the pinned pnpm version available
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm seed                    # creates the hotel's catalog in Proposales
pnpm dev                     # http://localhost:3000
```

### Environment variables

| Name | Required | What it is |
| --- | --- | --- |
| `PROPOSALES_API_KEY` | Yes | Bearer token for the Proposales developer interface. Only the server reads it. It never reaches the browser, so never give it a `NEXT_PUBLIC_` prefix. |
| `PROPOSALES_COMPANY_ID` | No | The Proposales company to use. When empty, the app uses the only company the token can see. |
| `APP_PASSWORD` | Yes | The shared password on the sign-in screen. Only the server reads it. Changing it signs everyone out, and when it is empty nobody can sign in. |

### Seed script

`pnpm seed` makes Proposales content match `lib/catalog/metadata.ts`. It creates missing items, restores archived ones, updates descriptions whose price text changed, and archives items that are no longer in the catalog. It matches items by their English title and is safe to run again. `pnpm seed --cleanup` archives every catalog item, and seeding again restores them.

### Checks

- `pnpm test` runs the unit tests with Vitest. They make no outside calls.
- `pnpm test:e2e` builds the app and runs the whole wizard in Playwright, on a desktop and a phone screen size. The route handlers really run; the test answers their calls to Proposales, so no real token is needed.
- `pnpm lint` and `pnpm build`.

## How pricing works

Every catalog item has one of five pricing units and a price in each supported currency: SEK, EUR, USD and GBP. Prices are whole numbers in the smallest unit of their currency (öre, cents or pence). The unit decides the suggested quantity:

| Unit | Quantity | Example: 45 guests, 2 days |
| --- | --- | --- |
| Per person | guests | Three-course dinner: 45 |
| Per person per day | guests × days | Coffee break: 45 × 2 = 90 |
| Per room per night | rooms × nights | Standard double, one per guest: 45 × 1 = 45 |
| Per day | days | Harbour Room: 2 |
| Flat | 1 | Microphone set: 1 |

**Days** count both the start and the end date: 14 to 15 October is 2 days.
**Nights** are days minus one, but at least one when the package has rooms, because guests stay the night after a one-day event. A one-day event with rooms is billed one night.

The template sets the number of rooms. For example, the wedding books one room per 8 guests, rounded up.

The line total is the unit price times the quantity, and the subtotal is the sum of the lines. The salesperson can change any quantity. The line is then marked "Custom" and can be reset to the suggestion.

The full-day conference for 45 guests over 2 days comes to 69,000 kronor. The Harbour Room seats 50 and is the smallest room that fits. That makes 36,000 kronor for the room, 8,550 for coffee breaks, 22,050 for lunch and 2,400 for the projector. Prices exclude tax. Amounts show two decimals only when they have any.

### Currencies

The salesperson picks the currency on the first step; SEK is the default. The interface shows amounts with the currency code, such as EUR 1,040.50. There are no exchange rates: each item has its own list price per currency in `lib/catalog/metadata.ts`, the way a hotel keeps a price list for foreign guests. The same conference in euros comes to EUR 5,985. Changing the currency keeps every other choice, and the draft, its product blocks and its stored subtotal are all in the chosen currency. Adding a currency means adding its code and a price for every item; the catalog schema refuses an item that misses one.

### Physical limits

Some items only exist so many times: each meeting space once, 40 standard doubles, 20 superior doubles, 4 suites, 3 projectors and 2 microphone sets. The number is `available` in `lib/catalog/metadata.ts`. Catering has no such limit and grows with the guests.

A limited item can be booked at most `available` times per day (meeting spaces, projectors), per night (rooms) or for the whole event (microphone sets). When the rules call for more, the suggestion stops at what exists and the line says how many must be arranged elsewhere. The quantity box will not go higher, and a package that goes over a limit, or has a meeting space too small for the guests, cannot be created: the confirm button is disabled and the server refuses it as well. These are the hotel's totals, not a check against real bookings for the dates.

## Design decisions

### Pure pricing functions shared by browser and server

All quantity and price logic lives in `lib/package` as pure functions: no network, no dates from the clock, no framework. The browser uses them for the live summary, the server uses them before creating the draft, and the unit tests cover them directly. Because both sides run the same code, the total the salesperson sees is the total that reaches Proposales.

### Recalculating on the server

The browser sends choices only: the template, guests and dates, items added or removed, changed quantities, and the customer's details. The request schema is strict, so a request that includes prices or totals is refused, not quietly ignored. The route handler loads the catalog, rebuilds the package with the shared functions, and sends Proposales the prices it calculated itself. Quantities, event length and list sizes have upper limits, so totals stay exact whole numbers.

### Templates as data

The five templates in `lib/templates/templates.ts` are plain data, checked by a Zod schema when the code loads. Each one names its event type, its items by catalog title, and a rooms rule. One kind of item says "the smallest meeting space that seats everyone" instead of naming a room. Adding a template means adding an entry, not writing code, and a mistake in one fails loudly before any page renders.

### Why TanStack Query

The browser makes three requests: the catalog, recent drafts, and creating a draft. TanStack Query caches the catalog for an hour and retries it once. It tracks the create request's state, which turns the button into "Creating draft…" and blocks double clicks. It refreshes recent drafts after a create, and cancels requests when the page no longer needs them. Without it, each of those would be hand-written state in the wizard. All three requests go through one helper with a time limit, and it turns every failure into a plain message.

### What Proposales could and couldn't store

Proposales content stores a title and a description per language. That is enough for the seed script to create the hotel's catalog, and each description ends with a readable price line in SEK.

Content cannot store a category, a pricing unit, prices or a seating capacity. Those live in `lib/catalog/metadata.ts`, keyed by the English title, and the server merges them with the live content. A content item without metadata is left out with a warning in the server log, and metadata without content asks you to run the seed.

A proposal stores product blocks with a quantity and a unit price, so the draft carries every priced line. It also stores free-form data, which this app uses for the source, template, guests, dates, currency, subtotal and internal notes. The source value is how "Recent drafts" finds the drafts this app created. Proposales has no notion of pricing rules such as "per person per day", so the quantity calculation stays in this app and the draft receives the result.

## What I would do next with more time

- **Real sign-in.** The app is behind one shared password, checked in `proxy.ts`, with a session cookie derived from it. That keeps casual visitors out, but everyone shares one secret and there is no limit on guesses. I would move to the hotel's own sign-in, with a person behind every draft.
- **Real availability.** Limits are the hotel's totals. Checking rooms and spaces against bookings for the chosen dates would need a booking system to ask.
- **Safe retries.** If Proposales creates a draft but the answer times out, trying again makes a second draft. The app warns about this. With an idempotency key from Proposales, or a check for a matching recent draft, it would not happen.
- **Prices in one place.** Move prices and units out of the code into Proposales, if its content model grows to hold them, or into a small store the hotel can edit.
- **Caching the catalog on the server**, so each draft makes one call to Proposales instead of two.
- **Templates the hotel can edit** without a code change.
- **Swedish and tax.** A Swedish interface, and totals including tax next to the totals without it.
- **Visual checks.** Screenshot comparisons at phone and desktop widths in both colour themes, so layout regressions fail a check instead of waiting for someone to notice.
