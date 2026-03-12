const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const headers = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('crm_access_token') || ''}`,
});

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
  let url = `${API_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    );
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('crm_access_token');
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || err.error || `Error ${res.status}`);
  }

  return res.json();
}

const GET = <T>(path: string, params?: Record<string, string>) => request<T>('GET', path, undefined, params);
const POST = <T>(path: string, body?: unknown) => request<T>('POST', path, body);
const PATCH = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const DELETE = <T>(path: string) => request<T>('DELETE', path);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      POST<{ accessToken: string; refreshToken: string; user: { id: string; email: string; role: string; tenantName: string } }>('/api/v1/auth/login', { email, password }),
    logout: () => POST('/api/v1/auth/logout'),
    me: () => GET<{ id: string; email: string; role: string; tenantName: string }>('/api/v1/auth/me'),
  },
  kpi: {
    dashboard: () => GET<import('@/types').DashboardKpi>('/api/v1/kpi/dashboard'),
  },
  customers: {
    list: (params?: Record<string, string>) => GET<import('@/types').Customer[]>('/api/v1/customers', params),
    get: (id: string) =>
      GET<import('@/types').Customer & { transactions: import('@/types').Transaction[]; followLogs: import('@/types').FollowLog[]; ltvProxy: number; maCps: number }>(`/api/v1/customers/${id}`),
    create: (data: Record<string, unknown>) => POST<import('@/types').Customer>('/api/v1/customers', data),
    update: (id: string, data: Record<string, unknown>) => PATCH<import('@/types').Customer>(`/api/v1/customers/${id}`, data),
    delete: (id: string) => DELETE<{ ok: boolean }>(`/api/v1/customers/${id}`),
  },
  prospects: {
    list: (params?: Record<string, string>) => GET<import('@/types').Prospect[]>('/api/v1/prospects', params),
    create: (data: Record<string, unknown>) => POST<import('@/types').Prospect>('/api/v1/prospects', data),
    update: (id: string, data: Record<string, unknown>) => PATCH<import('@/types').Prospect>(`/api/v1/prospects/${id}`, data),
    convert: (id: string) => POST<import('@/types').Customer>(`/api/v1/prospects/${id}/convert`),
    delete: (id: string) => DELETE<{ ok: boolean }>(`/api/v1/prospects/${id}`),
  },
  transactions: {
    create: (data: Record<string, unknown>) => POST<import('@/types').Transaction>('/api/v1/transactions', data),
    list: (params?: Record<string, string>) => GET<import('@/types').Transaction[]>('/api/v1/transactions', params),
    summary: (period: string) => GET<import('@/types').TransactionSummary>('/api/v1/transactions/summary', { period }),
  },
  products: {
    list: () => GET<import('@/types').Product[]>('/api/v1/products'),
    create: (data: Record<string, unknown>) => POST<import('@/types').Product>('/api/v1/products', data),
    update: (id: string, data: Record<string, unknown>) => PATCH<import('@/types').Product>(`/api/v1/products/${id}`, data),
    delete: (id: string) => DELETE<void>(`/api/v1/products/${id}`),
  },
  expenses: {
    list: (params?: Record<string, string>) => GET<unknown[]>('/api/v1/expenses', params),
    create: (data: Record<string, unknown>) => POST<unknown>('/api/v1/expenses', data),
    delete: (id: string) => DELETE<{ ok: boolean }>(`/api/v1/expenses/${id}`),
  },
  followLogs: {
    create: (data: Record<string, unknown>) => POST<import('@/types').FollowLog>('/api/v1/follow-logs', data),
    list: (params?: Record<string, string>) => GET<import('@/types').FollowLog[]>('/api/v1/follow-logs', params),
    todayCount: () => GET<{ count: number }>('/api/v1/follow-logs/today-count'),
    overdueCount: () => GET<{ count: number }>('/api/v1/follow-logs/overdue-count'),
  },
  referrals: {
    create: (data: Record<string, unknown>) => POST<unknown>('/api/v1/referrals', data),
    stats: () => GET<unknown>('/api/v1/referrals/stats'),
  },
  events: {
    list: () => GET<unknown[]>('/api/v1/events'),
    create: (data: Record<string, unknown>) => POST<unknown>('/api/v1/events', data),
  },
  marketingFunnel: {
    create: (data: Record<string, unknown>) => POST<import('@/types').MarketingFunnelRecord>('/api/v1/marketing-funnel', data),
    list: () => GET<import('@/types').MarketingFunnelRecord[]>('/api/v1/marketing-funnel'),
  },
  settings: {
    get: () => GET<Record<string, unknown>>('/api/v1/settings'),
  },
  integrations: {
    list: () => GET<{ id: string; type: string; enabled: boolean; accountId?: string }[]>('/api/v1/integrations'),
  },
};
