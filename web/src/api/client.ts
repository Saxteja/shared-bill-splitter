export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const error = body.error
    if (typeof error === 'string') return error
  }
  if (typeof body === 'string' && body.trim()) return body
  return fallback
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init: RequestOptions = {},
): Promise<T> {
  const { timeoutMs = 10000, signal: callerSignal, headers: inputHeaders, ...requestInit } = init
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    timeoutMs,
  )
  const abortFromCaller = () => controller.abort(callerSignal?.reason)
  if (callerSignal?.aborted) abortFromCaller()
  else callerSignal?.addEventListener('abort', abortFromCaller, { once: true })

  const headers = new Headers(inputHeaders)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  try {
    const response = await fetch(input, { ...requestInit, headers, signal: controller.signal })
    const contentType = response.headers.get('content-type') ?? ''
    const rawBody = response.status === 204 ? '' : await response.text()
    let body: unknown
    if (rawBody) {
      if (contentType.includes('application/json')) {
        try {
          body = JSON.parse(rawBody) as unknown
        } catch {
          body = rawBody
        }
      } else {
        body = rawBody
      }
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `API error ${response.status}: ${getErrorMessage(body, response.statusText)}`,
        body,
      )
    }
    return body as T
  } catch (error) {
    if (controller.signal.aborted && !(error instanceof ApiError)) {
      if (callerSignal?.aborted) throw new DOMException('Request was cancelled', 'AbortError')
      throw new DOMException('Request timed out', 'TimeoutError')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
    callerSignal?.removeEventListener('abort', abortFromCaller)
  }
}

export const api = {
  get: <T>(url: string, options: RequestOptions = {}) =>
    apiRequest<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body: unknown, extraHeaders?: HeadersInit) => {
    const headers = new Headers(extraHeaders)
    return apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body), headers })
  },
  patch: <T>(url: string, body: unknown) =>
    apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
}
