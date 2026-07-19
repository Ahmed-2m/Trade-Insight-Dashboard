/**
 * API helper for cloud sync. Uses the API server artifact.
 * In development, EXPO_PUBLIC_DOMAIN is the Replit dev domain.
 * The API server is routed at /api-server on the same domain.
 */
const domain = process.env.EXPO_PUBLIC_DOMAIN;
const API_BASE = domain
  ? `https://${domain}/api-server/api`
  : 'http://localhost:3000/api';

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setApiTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

async function request(method: string, path: string, body?: unknown) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  getProfile: () => request('GET', '/user/profile'),
  putProfile: (data: { initialBalance: number; language: string }) =>
    request('PUT', '/user/profile', data),

  getTrades: () => request('GET', '/trades'),
  postTrade: (trade: unknown) => request('POST', '/trades', trade),
  putTrade: (id: string, trade: unknown) => request('PUT', `/trades/${id}`, trade),
  deleteTrade: (id: string) => request('DELETE', `/trades/${id}`),

  getStrategies: () => request('GET', '/strategies'),
  postStrategy: (name: string) => request('POST', '/strategies', { name }),
  deleteStrategy: (name: string) =>
    request('DELETE', `/strategies/${encodeURIComponent(name)}`),

  sync: (payload: {
    trades: unknown[];
    strategies: string[];
    initialBalance: number;
    language: string;
  }) => request('POST', '/sync', payload),
};
