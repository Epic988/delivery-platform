import { Prisma, type PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type QuoteInput = {
  orderType: 'SHOPPING' | 'COURIER';
  zoneId?: string | null;
  weightGrams?: number | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
};

export async function calculateQuote(db: Db, input: QuoteInput): Promise<Prisma.Decimal> {
  const rules = await db.pricingRule.findMany({
    where: {
      orderType: input.orderType,
      isActive: true,
      OR: [{ zoneId: input.zoneId ?? null }, { zoneId: null }],
    },
    orderBy: { priority: 'desc' },
  });

  const rule =
    rules.find((r) => r.zoneId === (input.zoneId ?? null)) ??
    rules.find((r) => r.zoneId === null);

  if (!rule) {
    throw Object.assign(new Error('no_pricing_rule'), { statusCode: 400 });
  }

  let total = new Prisma.Decimal(rule.basePrice);

  if (
    rule.perKmPrice &&
    input.pickupLat != null &&
    input.pickupLng != null &&
    input.destLat != null &&
    input.destLng != null
  ) {
    const km = haversineKm(input.pickupLat, input.pickupLng, input.destLat, input.destLng);
    total = total.add(rule.perKmPrice.mul(km));
  }

  if (rule.weightSurchargePerKg && input.weightGrams && input.weightGrams > 0) {
    const kg = input.weightGrams / 1000;
    total = total.add(rule.weightSurchargePerKg.mul(kg));
  }

  if (rule.minPrice && total.lessThan(rule.minPrice)) total = new Prisma.Decimal(rule.minPrice);
  if (rule.maxPrice && total.greaterThan(rule.maxPrice)) total = new Prisma.Decimal(rule.maxPrice);

  return total;
}
