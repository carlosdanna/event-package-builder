// The whole wizard in a real browser against the real route handlers.
// Only the route handlers' calls to Proposales are answered by the test.
import { addDays, format } from "date-fns";
import { expect, test, type Page } from "next/experimental/testmode/playwright";
import { catalogMetadata, mergeCatalog } from "@/lib/catalog";
import { formatDateRange, formatMoney } from "@/lib/format";
import { assemblePackage, summarize } from "@/lib/package";
import { getTemplate } from "@/lib/templates";

const COMPANY_ID = 7;
const DRAFT_URL = "https://app.proposales.com/proposals/e2e-draft";
// Matches APP_PASSWORD in playwright.config.ts.
const E2E_PASSWORD = "test-password";

// The seeded catalog as Proposales would list it, one content item per metadata entry.
const contents = Object.entries(catalogMetadata).map(([title, entry], index) => ({
  product_id: 100 + index,
  variation_id: 200 + index,
  title: { en: title },
  description: { en: entry.description },
  created_at: 1_760_000_000_000,
}));

test("creates a conference draft with one changed quantity", async ({ page, next }) => {
  const proposalesCalls: { method: string; path: string; body: unknown }[] = [];

  next.onFetch(async (request) => {
    const url = new URL(request.url);
    if (url.hostname !== "api.proposales.com") return "continue";
    const body = request.method === "POST" ? await request.json() : undefined;
    proposalesCalls.push({ method: request.method, path: url.pathname, body });

    if (request.method === "GET" && url.pathname === "/v3/content") {
      return Response.json({ data: contents });
    }
    if (request.method === "GET" && url.pathname === "/v3/proposal-search") {
      return Response.json({ data: [] });
    }
    if (request.method === "POST" && url.pathname === "/v3/proposals") {
      return Response.json({ proposal: { uuid: "e2e-draft", url: DRAFT_URL } }, { status: 201 });
    }
    return new Response("Unexpected call in the test", { status: 500 });
  });

  const start = addDays(new Date(), 14);
  const end = addDays(start, 1);
  const startDate = format(start, "yyyy-MM-dd");
  const endDate = format(end, "yyyy-MM-dd");

  // What the server should send: the package rebuilt with the shared pricing functions.
  const catalog = mergeCatalog(contents, catalogMetadata).items;
  const coffeeBreak = catalog.find((item) => item.title === "Coffee break")!;
  const basics = { guests: 45, startDate, endDate };
  // The draft is priced in euros, from the catalog's euro price list.
  const choices = {
    addedContentIds: [],
    removedContentIds: [],
    overrides: { [coffeeBreak.contentId]: 45 },
  };
  const lines = assemblePackage(getTemplate("conference")!, basics, catalog, choices, "EUR");
  const expectedTotal = formatMoney(summarize(lines, basics).subtotal, "EUR");
  const expectedTitle = `Full-day conference for Acme AB, ${formatDateRange(startDate, endDate)}`;

  await signIn(page);

  // Currency and template
  await page.getByRole("combobox", { name: "Currency" }).click();
  await page.getByRole("option", { name: "EUR" }).click();
  await expect(page.getByRole("combobox", { name: "Currency" })).toHaveText("EUR");
  await page.getByRole("radio", { name: /Full-day conference/ }).check();
  await goNext(page);

  // Guests and dates
  await page.getByLabel("Number of guests").fill("45");
  await pickDate(page, "Start date", start);
  await pickDate(page, "End date", end);
  await expect(page.getByText("2 days, 1 night")).toBeVisible();
  await goNext(page);

  // Package: 45 guests over 2 days suggests 90 coffee breaks; keep one per guest.
  const coffeeQuantity = page.getByLabel("Quantity of Coffee break");
  await expect(coffeeQuantity).toHaveValue("90");
  await coffeeQuantity.fill("45");
  const coffeeLine = page.getByRole("listitem").filter({ has: coffeeQuantity });
  await expect(coffeeLine.getByText("Custom", { exact: true })).toBeVisible();
  await expect(page.getByText(expectedTotal).filter({ visible: true }).first()).toBeVisible();
  await goNext(page);

  // Customer
  await page.getByLabel("Company").fill("Acme AB");
  await page.getByLabel("Contact name").fill("Anna Berg");
  await page.getByLabel("Contact email").fill("anna@acme.example");
  await goNext(page);

  // Confirm
  const coffeeRow = page.getByRole("row", { name: /Coffee break/ });
  // 45 coffee breaks at EUR 8.50, whichever way the table is laid out.
  const coffeePrice = coffeeBreak.prices.EUR;
  await expect(coffeeRow).toContainText(`45 × ${formatMoney(coffeePrice, "EUR")}`);
  await expect(coffeeRow).toContainText(formatMoney(45 * coffeePrice, "EUR"));
  await page.getByRole("button", { name: "Create draft proposal" }).click();

  // Done
  await expect(page.getByRole("heading", { name: "Draft proposal created" })).toBeFocused();
  await expect(page.getByText(expectedTitle)).toBeVisible();
  await expect(page.getByText(expectedTotal)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open the draft in Proposales/ })).toHaveAttribute(
    "href",
    DRAFT_URL,
  );

  // What reached Proposales
  const unexpected = proposalesCalls.filter(
    (call) => !["/v3/content", "/v3/proposal-search", "/v3/proposals"].includes(call.path),
  );
  expect(unexpected).toEqual([]);

  const created = proposalesCalls.filter((call) => call.path === "/v3/proposals");
  expect(created).toHaveLength(1);
  const sent = created[0].body as {
    company_id: number;
    title_md: string;
    recipient: Record<string, string>;
    blocks: {
      content_id: number;
      currency: string;
      quantity: number;
      unit_value_without_discount_without_tax: number;
    }[];
    data: { subtotal: number; guests: number; currency: string };
  };
  expect(sent.company_id).toBe(COMPANY_ID);
  expect(sent.title_md).toBe(expectedTitle);
  expect(sent.recipient).toMatchObject({
    first_name: "Anna",
    last_name: "Berg",
    email: "anna@acme.example",
    company_name: "Acme AB",
  });
  expect(sent.blocks).toEqual(
    lines.map((line) =>
      expect.objectContaining({
        content_id: line.contentId,
        currency: "EUR",
        quantity: line.quantity,
        unit_value_without_discount_without_tax: line.unitPrice,
      }),
    ),
  );
  expect(sent.blocks.find((block) => block.content_id === coffeeBreak.contentId)?.quantity).toBe(45);
  expect(sent.blocks.every((block) => block.quantity > 0)).toBe(true);
  expect(sent.data).toMatchObject({
    guests: 45,
    currency: "EUR",
    subtotal: summarize(lines, basics).subtotal,
  });
});

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Pick a template" })).toBeVisible();
}

async function goNext(page: Page) {
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

// Opens the date picker by its label and picks the day, moving months forward if needed.
async function pickDate(page: Page, label: string, date: Date) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  const calendar = page.getByRole("dialog");
  const day = calendar.getByRole("button", { name: format(date, "EEEE, MMMM do, yyyy") });
  while (!(await day.isVisible())) {
    await calendar.getByRole("button", { name: "Go to the Next Month" }).click();
  }
  await day.click();
  await expect(calendar).toBeHidden();
}
