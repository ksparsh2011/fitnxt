import { useAuthStore } from '@/stores/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const NETWORK_ERROR = 'Unable to connect. Please check your connection and try again.';

function getToken(): string | undefined {
  return useAuthStore.getState().accessToken ?? undefined;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(NETWORK_ERROR);
  }
}

async function throwIfError(res: Response): Promise<void> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Request failed');
  }
}

async function parseBody<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as T;
}

export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await safeFetch(`${API_BASE}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
  });
  await throwIfError(res);
  return parseBody<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T | null> {
  const res = await safeFetch(`${API_BASE}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  await throwIfError(res);
  return parseBody<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T | null> {
  const res = await safeFetch(`${API_BASE}/api/v1${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  await throwIfError(res);
  return parseBody<T>(res);
}

export async function apiDelete(path: string): Promise<void> {
  const res = await safeFetch(`${API_BASE}/api/v1${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
  });
  await throwIfError(res);
}
