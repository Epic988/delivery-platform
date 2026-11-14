import type { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

export type DispatchInput = {
  orderType: 'SHOPPING' | 'COURIER';
  orderId: string;
  driverId: string;
  assignedByUserId: string;
  notes?: string;
};

export async function dispatchDriver(db: Db, input: DispatchInput) {
  const driver = await db.driver.findUnique({ where: { id: input.driverId } });
  if (!driver || !driver.isVerified) {
    throw Object.assign(new Error('driver_not_available'), { statusCode: 400 });
  }

  const existing = await db.assignment.findFirst({
    where: {
      isActive: true,
      OR:
        input.orderType === 'SHOPPING'
          ? [{ shoppingOrderId: input.orderId }]
          : [{ courierOrderId: input.orderId }],
    },
  });
  if (existing) {
    throw Object.assign(new Error('order_already_assigned'), { statusCode: 409 });
  }

  if (input.orderType === 'SHOPPING') {
    const order = await db.shoppingOrder.findUnique({ where: { id: input.orderId } });
    if (!order) throw Object.assign(new Error('order_not_found'), { statusCode: 404 });
    if (order.status !== 'CONFIRMED') {
      throw Object.assign(new Error('order_not_dispatchable'), { statusCode: 409 });
    }
    const assignment = await db.assignment.create({
      data: {
        orderType: 'SHOPPING',
        shoppingOrderId: input.orderId,
        driverId: input.driverId,
        status: 'ASSIGNED',
        notes: input.notes,
      },
    });
    await db.shoppingOrder.update({
      where: { id: input.orderId },
      data: { status: 'ASSIGNED' },
    });
    await db.deliveryEvent.create({
      data: {
        orderType: 'SHOPPING',
        shoppingOrderId: input.orderId,
        status: 'ASSIGNED',
        actorId: input.assignedByUserId,
        driverId: input.driverId,
        note: 'dispatched',
      },
    });
    return assignment;
  }

  const order = await db.courierOrder.findUnique({ where: { id: input.orderId } });
  if (!order) throw Object.assign(new Error('order_not_found'), { statusCode: 404 });
  if (order.status !== 'QUOTED' && order.status !== 'CONFIRMED') {
    throw Object.assign(new Error('order_not_dispatchable'), { statusCode: 409 });
  }
  const assignment = await db.assignment.create({
    data: {
      orderType: 'COURIER',
      courierOrderId: input.orderId,
      driverId: input.driverId,
      status: 'ASSIGNED',
      notes: input.notes,
    },
  });
  await db.courierOrder.update({
    where: { id: input.orderId },
    data: { status: 'ASSIGNED' },
  });
  await db.deliveryEvent.create({
    data: {
      orderType: 'COURIER',
      courierOrderId: input.orderId,
      status: 'ASSIGNED',
      actorId: input.assignedByUserId,
      driverId: input.driverId,
      note: 'dispatched',
    },
  });
  return assignment;
}
