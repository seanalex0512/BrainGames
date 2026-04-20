import type { ApiResponse } from '@braingames/shared';

const BASE_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? '';

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const body = await res.json().catch(() => null) as ApiResponse<T> | null;
    return {
      success: false,
      data: null,
      error: body?.error ?? `HTTP ${res.status}: ${res.statusText}`,
    };
  }
  return res.json() as Promise<ApiResponse<T>>;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    return handleResponse<T>(res);
  } catch {
    return { success: false, data: null, error: 'Network error' };
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  } catch {
    return { success: false, data: null, error: 'Network error' };
  }
}

export async function apiPut<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  } catch {
    return { success: false, data: null, error: 'Network error' };
  }
}

export async function apiDelete(path: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
    if (res.status === 204) return { success: true, data: null, error: null };
    return handleResponse<null>(res);
  } catch {
    return { success: false, data: null, error: 'Network error' };
  }
}
