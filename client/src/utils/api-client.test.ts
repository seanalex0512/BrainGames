import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGet, apiPost, apiPut, apiDelete } from './api-client';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  }));
}

function mockFetchNetworkError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

describe('apiGet', () => {
  it('returns successful response', async () => {
    mockFetch(200, { success: true, data: { id: '1' }, error: null });
    const result = await apiGet<{ id: string }>('/api/test');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('1');
  });

  it('returns error on non-200 response', async () => {
    mockFetch(404, { success: false, data: null, error: 'Not found' });
    const result = await apiGet('/api/test');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('returns network error on fetch failure', async () => {
    mockFetchNetworkError();
    const result = await apiGet('/api/test');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('apiPost', () => {
  it('returns created resource', async () => {
    mockFetch(201, { success: true, data: { id: '2', title: 'New' }, error: null });
    const result = await apiPost<{ id: string; title: string }>('/api/quizzes', { title: 'New' });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('New');
  });

  it('returns network error on fetch failure', async () => {
    mockFetchNetworkError();
    const result = await apiPost('/api/quizzes', {});
    expect(result.success).toBe(false);
  });
});

describe('apiPut', () => {
  it('returns updated resource', async () => {
    mockFetch(200, { success: true, data: { id: '1', title: 'Updated' }, error: null });
    const result = await apiPut<{ id: string; title: string }>('/api/quizzes/1', { title: 'Updated' });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Updated');
  });
});

describe('apiDelete', () => {
  it('returns success on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    }));
    const result = await apiDelete('/api/quizzes/1');
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('returns network error on fetch failure', async () => {
    mockFetchNetworkError();
    const result = await apiDelete('/api/quizzes/1');
    expect(result.success).toBe(false);
  });
});
