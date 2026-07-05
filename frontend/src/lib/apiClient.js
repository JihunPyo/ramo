const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

export class ApiError extends Error {
  constructor(message, { status = 0, details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function createHttpClient({ baseUrl = import.meta.env.VITE_API_BASE_URL ?? '' } = {}) {
  return {
    async request(path, { method = 'GET', body, query, headers } = {}) {
      const url = buildUrl(baseUrl, path, query)
      const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData
      const response = await fetch(url, {
        method,
        headers: {
          ...getDefaultHeaders(isFormDataBody),
          ...headers,
        },
        body: getRequestBody(body, isFormDataBody),
      })

      const payload = await parseResponse(response)

      if (!response.ok) {
        throw new ApiError(getErrorMessage(payload, response.statusText), {
          status: response.status,
          details: payload,
        })
      }

      return payload
    },
  }
}

export const httpClient = createHttpClient()

function getDefaultHeaders(isFormDataBody) {
  if (isFormDataBody) {
    return { Accept: DEFAULT_HEADERS.Accept }
  }

  return DEFAULT_HEADERS
}

function getRequestBody(body, isFormDataBody) {
  if (body === undefined) {
    return undefined
  }

  return isFormDataBody ? body : JSON.stringify(body)
}

function buildUrl(baseUrl, path, query) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${normalizedBaseUrl}${normalizedPath}`, window.location.origin)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (response.status === 204) {
    return null
  }

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function getErrorMessage(payload, fallback) {
  if (payload && typeof payload === 'object') {
    return payload.detail ?? payload.message ?? fallback
  }

  return payload || fallback
}
