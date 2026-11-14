export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'STORE_OWNER';
export type OrderStatus = 'PENDING' | 'QUOTED' | 'CONFIRMED' | 'ASSIGNED' | 'ACCEPTED' | 'ARRIVING_AT_PICKUP' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface User { id: string; phone: string; email?: string | null; fullName: string; role: Role; language: string; status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; createdAt: string; }
export interface AuthResponse { user: User; token: string; }
export interface Paginated<T> { data: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number }; }

export interface Category { id: string; slug: string; nameAr: string; nameEn?: string | null; parentId?: string | null; storeId?: string | null; sortOrder: number; }
export interface Store { id: string; slug: string; nameAr: string; nameEn?: string | null; description?: string | null; logoUrl?: string | null; phone?: string | null; isOpen: boolean; addressText: string; lat: number; lng: number; categories?: Category[]; }
export interface Product { id: string; nameAr: string; nameEn?: string | null; description?: string | null; price: string; currency: string; imageUrl?: string | null; stock?: number | null; storeId: string; categoryId?: string | null; store?: { id: string; slug: string; nameAr: string; nameEn?: string | null }; }

export interface Address { id: string; label?: string | null; addressText: string; city?: string | null; district?: string | null; lat?: number | null; lng?: number | null; notes?: string | null; isDefault: boolean; }

export interface CartItem { id: string; productId: string; quantity: number; unitPrice: string; product: { id: string; nameAr: string; nameEn?: string | null; price: string; currency: string; imageUrl?: string | null }; }
export interface Cart { id: string; storeId: string; store: { id: string; slug: string; nameAr: string; nameEn?: string | null }; items: CartItem[]; }

export interface OrderItem { id: string; productId: string; quantity: number; unitPrice: string; totalPrice: string; product?: { id: string; nameAr: string; nameEn?: string | null; price: string; currency: string; imageUrl?: string | null }; }
export interface ShoppingOrder { id: string; orderNumber: string; storeId: string; store?: { id: string; slug: string; nameAr: string; nameEn?: string | null }; status: OrderStatus; subtotal: string; deliveryFee: string; total: string; currency: string; paymentMethod: 'CASH_ON_DELIVERY'; notes?: string | null; createdAt: string; completedAt?: string | null; items?: OrderItem[]; events?: Array<{ id: string; status: OrderStatus; note?: string | null; createdAt: string }>; }

export interface CourierOrder { id: string; orderNumber: string; senderName: string; senderPhone: string; recipientName: string; recipientPhone: string; packageDescription: string; packageCategory: string; packageSize: 'ENVELOPE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM'; weightGrams?: number | null; pickupAddressText: string; destinationAddressText: string; status: OrderStatus; quotedPrice?: string | null; finalPrice?: string | null; currency: string; createdAt: string; events?: Array<{ id: string; status: OrderStatus; note?: string | null; createdAt: string }>; }

export interface Assignment { id: string; orderType: 'SHOPPING' | 'COURIER'; shoppingOrderId?: string | null; courierOrderId?: string | null; status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED' | 'FAILED'; isActive: boolean; assignedAt: string; notes?: string | null; shoppingOrder?: ShoppingOrder; courierOrder?: CourierOrder; }

export interface DriverProfile { id: string; vehicleType: string; vehiclePlate?: string | null; licenseNumber?: string | null; isAvailable: boolean; isVerified: boolean; rating?: number | null; }

export interface CourierQuoteInput { weightGrams?: number; pickupLat?: number; pickupLng?: number; destLat?: number; destLng?: number; zoneId?: string; }
export interface CourierCreateInput { senderName: string; senderPhone: string; recipientName: string; recipientPhone: string; packageDescription: string; packageCategory: string; packageSize: 'ENVELOPE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM'; weightGrams?: number; pickupAddressText: string; pickupLat?: number; pickupLng?: number; pickupNotes?: string; destinationAddressText: string; destinationLat?: number; destinationLng?: number; destinationNotes?: string; deliveryInstructions?: string; specialHandlingNotes?: string; zoneId?: string; }
