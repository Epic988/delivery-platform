import type { AuthResponse, User, Store, Product, Category, Address, Cart, CartItem, Paginated, ShoppingOrder, CourierOrder, CourierQuoteInput, CourierCreateInput, Assignment, DriverProfile } from './types';

export interface ApiClientConfig { baseUrl: string; getToken?: () => string | null; }
export class ApiError extends Error {
  constructor(public statusCode: number, public code: string, message: string) { super(message); }
}
function toQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function createApiClient(cfg: ApiClientConfig) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { ...((init.headers as Record<string, string>) ?? {}) };
    
    // إرسال Content-Type فقط إذا كان هناك Body
    if (init.body) {
      headers['content-type'] = 'application/json';
    }
    
    const token = cfg.getToken?.();
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`${cfg.baseUrl}${path}`, { ...init, headers });
    if (res.status === 204) return undefined as unknown as T;
    const data = await res.json().catch(() => ({} as Record<string, any>));
    
    if (!res.ok) {
      let msg = data.message || data.error || res.statusText;
      if (data.details && data.details.fieldErrors) {
        const errors = Object.entries(data.details.fieldErrors)
          .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
          .join(' | ');
        msg = `خطأ في البيانات - ${errors}`;
      }
      throw new ApiError(res.status, data.error ?? 'error', msg);
    }
    return data as T;
  }

  return {
    register: (body: { phone: string; fullName: string; password: string; language?: string }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { phone: string; password: string }) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<{ user: User }>('/api/auth/me'),

    stores: (params?: { page?: number; pageSize?: number; q?: string }) => request<Paginated<Store>>(`/api/stores${toQuery(params)}`),
    store: (slug: string) => request<{ store: Store }>(`/api/stores/${slug}`),
    products: (params?: { storeSlug?: string; q?: string; categoryId?: string; page?: number; pageSize?: number }) => request<Paginated<Product>>(`/api/products${toQuery(params)}`),
    product: (id: string) => request<{ product: Product }>(`/api/products/${id}`),
    categories: (params?: { storeSlug?: string; storeId?: string }) => request<{ data: Category[] }>(`/api/categories${toQuery(params)}`),

    addresses: () => request<{ data: Address[] }>('/api/addresses'),
    createAddress: (body: { addressText: string; label?: string; isDefault?: boolean }) => request<{ address: Address }>('/api/addresses', { method: 'POST', body: JSON.stringify(body) }),
    updateAddress: (id: string, body: { label?: string; addressText?: string; city?: string; district?: string; lat?: number; lng?: number; notes?: string; isDefault?: boolean }) => request<{ address: Address }>(`/api/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteAddress: (id: string) => request<void>(`/api/addresses/${id}`, { method: 'DELETE' }),
    carts: () => request<{ data: Cart[] }>('/api/carts'),
    addToCart: (storeId: string, body: { productId: string; quantity: number }) => request<{ item: CartItem; cartId: string }>(`/api/carts/${storeId}/items`, { method: 'POST', body: JSON.stringify(body) }),
    updateCartItem: (storeId: string, productId: string, quantity: number) => request<{ item: CartItem }>(`/api/carts/${storeId}/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    deleteCartItem: (storeId: string, productId: string) => request<void>(`/api/carts/${storeId}/items/${productId}`, { method: 'DELETE' }),

    checkout: (body: { addressId: string; notes?: string }) => request<{ checkoutGroup: { id: string; totalAmount: string }; orders: ShoppingOrder[] }>('/api/checkout', { method: 'POST', body: JSON.stringify(body) }),
    shoppingOrders: (params?: { page?: number; pageSize?: number }) => request<Paginated<ShoppingOrder>>(`/api/shopping-orders${toQuery(params)}`),
    shoppingOrder: (id: string) => request<{ order: ShoppingOrder }>(`/api/shopping-orders/${id}`),

    courierQuote: (body: CourierQuoteInput) => request<{ quotedPrice: string; currency: string }>('/api/courier-orders/quote', { method: 'POST', body: JSON.stringify(body) }),
    createCourierOrder: (body: CourierCreateInput) => request<{ order: CourierOrder }>('/api/courier-orders', { method: 'POST', body: JSON.stringify(body) }),
    courierOrders: (params?: { page?: number; pageSize?: number }) => request<Paginated<CourierOrder>>(`/api/courier-orders${toQuery(params)}`),
    courierOrder: (id: string) => request<{ order: CourierOrder }>(`/api/courier-orders/${id}`),

    driverMe: () => request<{ driver: DriverProfile; activeAssignments: Assignment[] }>('/api/driver/me'),
    driverAvailability: (isAvailable: boolean) => request<{ driver: DriverProfile }>('/api/driver/availability', { method: 'PATCH', body: JSON.stringify({ isAvailable }) }),
    driverAssignments: () => request<{ data: Assignment[] }>('/api/driver/assignments'),
    acceptAssignment: (id: string) => request<{ assignment: Assignment }>(`/api/driver/assignments/${id}/accept`, { method: 'POST' }),
    declineAssignment: (id: string) => request<{ assignment: Assignment }>(`/api/driver/assignments/${id}/decline`, { method: 'POST' }),
    updateAssignmentStatus: (id: string, status: string, note?: string) => request<{ assignment: Assignment; order: unknown }>(`/api/driver/assignments/${id}/status`, { method: 'POST', body: JSON.stringify({ status, note }) }),
    submitProof: (id: string, body: { recipientName?: string; notes?: string }) => request<{ proof: unknown }>(`/api/driver/assignments/${id}/proof`, { method: 'POST', body: JSON.stringify(body) }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
