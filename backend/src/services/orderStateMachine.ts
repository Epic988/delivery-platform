import type { OrderStatus } from '@prisma/client';

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['QUOTED', 'CONFIRMED', 'CANCELLED'],
  QUOTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'CONFIRMED', 'CANCELLED'],
  ACCEPTED: ['ARRIVING_AT_PICKUP', 'PICKED_UP', 'ASSIGNED', 'CANCELLED'],
  ARRIVING_AT_PICKUP: ['PICKED_UP', 'FAILED', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'FAILED', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw Object.assign(new Error(`invalid_transition:${from}->${to}`), { statusCode: 409 });
  }
}

