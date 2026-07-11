let cached: { url: string; token: string } | null = null

export async function getBackendCredentials(): Promise<{ url: string; token: string }> {
  if (!cached) cached = await window.electronAPI.getBackend()
  return cached
}

export function resetBackendCredentials(): void {
  cached = null
}

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const { url, token } = await getBackendCredentials()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${url}${path}`, { ...init, headers })
}

