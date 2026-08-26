export const API_BASE_URL = 'http://localhost:3939';

export interface JsonRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function jsonFetch(url: string, options: JsonRequestOptions = {}) {
  const { method = 'GET', headers = {}, body } = options;

  const token = localStorage.getItem('jwtToken');
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token && !url.includes('/api/auth/')) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: authHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

