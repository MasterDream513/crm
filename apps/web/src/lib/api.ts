/**
 * Typed API client — wraps all fetch calls to the Hono backend.
 * Token is read from localStorage (set on login).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('crm_access_token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string; refreshToken: string; user: any }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
    me: () => request<any>('/api/v1/auth/me'),
  },
  kpi: {
    dashboard: () => request<any>('/api/v1/kpi/dashboard'),
  },
  customers: {
    list: (params?: Record<string, string>) =>
      request<any[]>(`/api/v1/customers?${new URLSearchParams(params).toString()}`),
    get: (id: string) => request<any>(`/api/v1/customers/${id}`),
    create: (data: any) =>
      request<any>('/api/v1/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  transactions: {
    create: (data: any) =>
      request<any>('/api/v1/transactions', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: Record<string, string>) =>
      request<any[]>(`/api/v1/transactions?${new URLSearchParams(params).toString()}`),
    summary: (period: 'daily' | 'weekly' | 'monthly') =>
      request<any>(`/api/v1/transactions/summary?period=${period}`),
  },
  products: {
    list: () => request<any[]>('/api/v1/products'),
    create: (data: any) =>
      request<any>('/api/v1/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request('/api/v1/products/' + id, { method: 'DELETE' }),
  },
  expenses: {
    list: (params?: Record<string, string>) =>
      request<any[]>(`/api/v1/expenses?${new URLSearchParams(params).toString()}`),
    create: (data: any) =>
      request<any>('/api/v1/expenses', { method: 'POST', body: JSON.stringify(data) }),
  },
  followLogs: {
    create: (data: any) =>
      request<any>('/api/v1/follow-logs', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: Record<string, string>) =>
      request<any[]>(`/api/v1/follow-logs?${new URLSearchParams(params).toString()}`),
    todayCount: () => request<{ count: number }>('/api/v1/follow-logs/today-count'),
    overdueCount: () => request<{ count: number }>('/api/v1/follow-logs/overdue-count'),
  },
  referrals: {
    create: (data: any) =>
      request<any>('/api/v1/referrals', { method: 'POST', body: JSON.stringify(data) }),
    stats: () => request<any>('/api/v1/referrals/stats'),
  },
  events: {
    list: () => request<any[]>('/api/v1/events'),
    create: (data: any) =>
      request<any>('/api/v1/events', { method: 'POST', body: JSON.stringify(data) }),
    markAttendance: (eventId: string, attendeeId: string, status: string) =>
      request<any>(`/api/v1/events/${eventId}/attendees/${attendeeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  marketingFunnel: {
    create: (data: any) =>
      request<any>('/api/v1/marketing-funnel', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<any[]>('/api/v1/marketing-funnel'),
  },
  settings: {
    get: () => request<any>('/api/v1/settings'),
  },
  integrations: {
    list: () => request<any[]>('/api/v1/integrations'),
  },
}
