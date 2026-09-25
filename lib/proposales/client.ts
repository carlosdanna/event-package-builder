// Small fetch wrapper for the Proposales developer interface.
// Adds the bearer token, a time limit, and turns every failure into a ProposalesError.
import "server-only";
import type { z } from "zod";
import { ProposalesError } from "./errors";
import { errorBodySchema } from "./schemas";

const PROPOSALES_BASE_URL = "https://api.proposales.com";
export const TIMEOUT_MS = 10_000;

type QueryValue = string | number | boolean | undefined;

export type ProposalesRequest<T extends z.ZodType> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  schema: T;
};

export async function proposalesFetch<T extends z.ZodType>(
  path: string,
  request: ProposalesRequest<T>,
): Promise<z.infer<T>> {
  const response = await send(path, request);

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  const parsed = request.schema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new ProposalesError(
      "invalid_response",
      "Proposales sent a response in an unexpected format.",
      { status: response.status, cause: parsed.error },
    );
  }
  return parsed.data;
}

function readApiKey(): string {
  const key = process.env.PROPOSALES_API_KEY;
  if (!key) {
    throw new ProposalesError(
      "configuration",
      "PROPOSALES_API_KEY is not set on the server.",
    );
  }
  return key;
}

function buildUrl(path: string, query: Record<string, QueryValue> = {}) {
  const url = new URL(path, PROPOSALES_BASE_URL);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }
  return url;
}

async function send(path: string, request: ProposalesRequest<z.ZodType>) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${readApiKey()}`,
    Accept: "application/json",
  };
  if (request.body !== undefined) headers["Content-Type"] = "application/json";

  try {
    return await fetch(buildUrl(path, request.query), {
      method: request.method ?? "GET",
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (isTimeout(error)) {
      throw new ProposalesError(
        "timeout",
        `Proposales did not answer within ${TIMEOUT_MS / 1000} seconds.`,
        { cause: error },
      );
    }
    throw new ProposalesError("network", "Could not reach Proposales.", {
      cause: error,
    });
  }
}

function isTimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function errorFromResponse(response: Response) {
  const body = errorBodySchema.safeParse(await readJson(response));
  if (body.success) {
    return new ProposalesError("http", body.data.error.message, {
      status: response.status,
      issues: body.data.error.issues,
    });
  }
  return new ProposalesError(
    "http",
    `Proposales answered with status ${response.status}.`,
    { status: response.status },
  );
}
