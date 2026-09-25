// Calls one of this app's route handlers and reads the answer with a schema.
// Every failure becomes a RequestError with a message fit for the interface.
import type { z } from "zod";
import { routeErrorSchema } from "@/lib/schemas/route-error";

export type RequestErrorKind =
  | "timeout" // no answer within the time limit
  | "network" // the request never reached the server
  | "status" // the server answered with an error status
  | "format"; // the answer did not match the schema

export class RequestError extends Error {
  readonly kind: RequestErrorKind;
  readonly status?: number;

  constructor(kind: RequestErrorKind, message: string, status?: number) {
    super(message);
    this.name = "RequestError";
    this.kind = kind;
    this.status = status;
  }
}

type FetchJsonOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal; // from TanStack Query, so leaving the page cancels the request
  timeoutMs: number;
  fallbackMessage: string;
};

export async function fetchJson<T extends z.ZodType>(
  url: string,
  schema: T,
  options: FetchJsonOptions,
): Promise<z.infer<T>> {
  const timeout = AbortSignal.timeout(options.timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const response = await send(url, options, signal, timeout);
  const body: unknown = await response.json().catch(() => null);

  if (timeout.aborted) throw timeoutError();
  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    const message = parsed.success ? parsed.data.error : options.fallbackMessage;
    throw new RequestError("status", message, response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new RequestError("format", options.fallbackMessage, response.status);
  return parsed.data;
}

async function send(
  url: string,
  options: FetchJsonOptions,
  signal: AbortSignal,
  timeout: AbortSignal,
) {
  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
    });
  } catch (error) {
    if (timeout.aborted) throw timeoutError();
    // Cancelled by TanStack Query: pass the abort on so the query ignores it.
    if (options.signal?.aborted) throw error;
    throw new RequestError(
      "network",
      "Could not reach the server. Check the connection and try again.",
    );
  }
}

function timeoutError() {
  return new RequestError("timeout", "The server did not answer in time. Try again.");
}
