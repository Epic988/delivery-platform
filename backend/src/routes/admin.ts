import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { dispatchDriver } from '../services/dispatch.js';
import { hashPassword } from '../lib/password.js';
import { normalizeSudanesePhone, isValidSudanesePhone } from '../lib/phone.js';

const pageQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const userStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }).strict();
const idSchema = z.object({ id: z.string().uuid() });

const storeCreateSchema = z
  .object({
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    nameAr: z.string().min(2).max(120),
    nameEn: z.string().max(120).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
    phone: z.string().max(30).optional(),
    addressText: z.string().min(1).max(500),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    isActive: z.boolean().optional(),
    isOpen: z.boolean().optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    coverUrl: z.string().url().optional(),
    images: z.array(z.string().url()).max(15).optional(),
    cuisineType: z.string().max(60).optional(),
    estimatedPrepMinutes: z.number().int().positive().max(240).optional(),
    minOrderAmount: z.number().nonnegative().optional(),
  })
  .strict();

const productCreateSchema = z
  .object({
    nameAr: z.string().min(1).max(200),
    nameEn: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    sku: z.string().max(80).optional(),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    isAvailable: z.boolean().optional(),
    stock: z.number().int().nonnegative().optional(),
    weightGrams: z.number().int().nonnegative().optional(),
    images: z.array(z.string().url()).max(10).optional(),
    variants: z.array(z.object({
      label: z.string().min(1).max(50),
      price: z.number().positive(),
    })).max(20).optional(),
  })
  .strict();

const driverCreateSchema = z
  .object({
    phone: z
      .string()
      .transform(normalizeSudanesePhone)
      .refine(isValidSudanesePhone, { message: 'invalid_phone' }),
    fullName: z.string().min(2).max(120),
    password: z.string().min(8).max(128),
    vehicleType: z.enum(['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK', 'BICYCLE']),
    vehiclePlate: z.string().max(30).optional(),
    licenseNumber: z.string().max(50).optional(),
    isVerified: z.boolean().optional(),
  })
  .strict();

const zoneCreateSchema = z
  .object({
    nameAr: z.string().min(2).max(120),
    nameEn: z.string().max(120).optional(),
    city: z.string().max(120).optional(),
    centerLat: z.number().min(-90).max(90).optional(),
    centerLng: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().positive().optional(),
  })
  .strict();

const pricingCreateSchema = z
  .object({
    orderType: z.enum(['SHOPPING', 'COURIER']),
    zoneId: z.string().uuid().optional(),
    basePrice: z.number().nonnegative(),
    perKmPrice: z.number().nonnegative().optional(),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    weightSurchargePerKg: z.number().nonnegative().optional(),
    priority: z.number().int().optional(),
  })
  .strict();

const dispatchSchema = z
  .object({
    orderType: z.enum(['SHOPPING', 'COURIER']),
    orderId: z.string().uuid(),
    driverId: z.string().uuid(),
    notes: z.string().max(500).optional(),
  })
  .strict();

const adminRoutes: FastifyPluginAsync = async (app) => {
  const admin = { preHandler: [app.requireRole(['ADMIN'])] };

  app.get('/admin/stats', admin, async () => {
    const [customers, drivers, stores, products, shoppingOrders, courierOrders, assignments] =
      await Promise.all([
        app.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        app.prisma.driver.count(),
        app.prisma.store.count(),
        app.prisma.product.count(),
        app.prisma.shoppingOrder.count(),
        app.prisma.courierOrder.count(),
        app.prisma.assignment.count(),
      ]);
    return {
      customers,
      drivers,
      stores,
      products,
      shoppingOrders,
      courierOrders,
      assignments,
    };
  });

  app.get('/admin/users', admin, async (req) => {
    const q = pageQuery
      .extend({ role: z.enum(['CUSTOMER', 'DRIVER', 'ADMIN', 'STORE_OWNER']).optional() })
      .parse(req.query);
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const where = q.role ? { role: q.role } : {};
    const [data, total] = await Promise.all([
      app.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      app.prisma.user.count({ where }),
    ]);
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  });

  app.patch('/admin/users/:id/status', admin, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const body = userStatusSchema.parse(req.body);
    const user = await app.prisma.user.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, phone: true, role: true, status: true },
    });
    return { user };
  });

  app.post('/admin/stores', admin, async (req, reply) => {
    const body = storeCreateSchema.parse(req.body);
    const exists = await app.prisma.store.findUnique({ where: { slug: body.slug } });
    if (exists) return reply.status(409).send({ error: 'slug_taken' });
    const store = await app.prisma.store.create({ data: body });
    return reply.status(201).send({ store });
  });

  app.post('/admin/stores/:id/products', admin, async (req, reply) => {
    const { id } = idSchema.parse(req.params);
    const body = productCreateSchema.parse(req.body);
    const store = await app.prisma.store.findUnique({ where: { id } });
    if (!store) return reply.status(404).send({ error: 'store_not_found' });
    const product = await app.prisma.product.create({
      data: {
        storeId: id,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        description: body.description,
        sku: body.sku,
        price: body.price,
        compareAtPrice: body.compareAtPrice,
        categoryId: body.categoryId,
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable ?? true,
        stock: body.stock,
        weightGrams: body.weightGrams,
        images: body.images,
        variants: body.variants,
      },
    });
    return reply.status(201).send({ product });
  });

  app.post('/admin/drivers', admin, async (req, reply) => {
    const body = driverCreateSchema.parse(req.body);
    const existing = await app.prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) return reply.status(409).send({ error: 'phone_taken' });

    const passwordHash = await hashPassword(body.password);
    const user = await app.prisma.user.create({
      data: {
        phone: body.phone,
        fullName: body.fullName,
        passwordHash,
        role: 'DRIVER',
        driver: {
          create: {
            vehicleType: body.vehicleType,
            vehiclePlate: body.vehiclePlate,
            licenseNumber: body.licenseNumber,
            isVerified: body.isVerified ?? false,
          },
        },
      },
      select: { id: true, phone: true, fullName: true, role: true },
    });
    return reply.status(201).send({ user });
  });

  app.post('/admin/delivery-zones', admin, async (req, reply) => {
    const body = zoneCreateSchema.parse(req.body);
    const zone = await app.prisma.deliveryZone.create({ data: body });
    return reply.status(201).send({ zone });
  });

  app.post('/admin/pricing-rules', admin, async (req, reply) => {
    const body = pricingCreateSchema.parse(req.body);
    const rule = await app.prisma.pricingRule.create({ data: body });
    return reply.status(201).send({ rule });
  });

  app.post('/admin/dispatch', admin, async (req, reply) => {
    const body = dispatchSchema.parse(req.body);
    const assignment = await dispatchDriver(app.prisma, {
      orderType: body.orderType,
      orderId: body.orderId,
      driverId: body.driverId,
      assignedByUserId: req.user.sub,
      notes: body.notes,
    });
    return reply.status(201).send({ assignment });
  });

  app.get('/admin/courier-orders', admin, async () => {
    const data = await app.prisma.courierOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { fullName: true, phone: true } } }
    });
    return { data };
  });

  app.get('/admin/drivers-list', admin, async () => {
    const data = await app.prisma.driver.findMany({
      include: { user: { select: { fullName: true, phone: true } } }
    });
    return { data };
  });
};
export default adminRoutes;

