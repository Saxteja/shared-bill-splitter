// src/api/client.ts
// Centralized thin HTTP client for the Split Ledger frontend.

/**
 * Simple wrapper around fetch that:
 *  - Sends JSON bodies and parses JSON responses.
 *  - Applies a default timeout (10 seconds).
 *  - Throws on non‑2xx status codes with a useful message.
 */
export async function apiRequest<T>(
  input: RequestInfo,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const timeout = init?.timeoutMs ?? 10000; // 10 s default
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  const response = await fetch(input, {
    ...init,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  clearTimeout(id)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${text || response.statusText}`)
  }

  // Empty response bodies (e.g., 204) resolve to undefined.
  if (response.status === 204) return undefined as unknown as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T>(url: string, body: any, extraHeaders?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: extraHeaders,
    }),
  patch: <T>(url: string, body: any) =>
    apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
}
