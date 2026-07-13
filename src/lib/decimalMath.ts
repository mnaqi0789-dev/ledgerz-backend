import { Prisma } from "@prisma/client";

export function weightedAverageCost(
  existingQuantity: Prisma.Decimal,
  existingPrice: Prisma.Decimal,
  incomingQuantity: Prisma.Decimal,
  incomingPrice: Prisma.Decimal,
): Prisma.Decimal {
  const totalOldCost = existingQuantity.times(existingPrice);
  const totalNewCost = incomingQuantity.times(incomingPrice);
  const totalQuantity = existingQuantity.plus(incomingQuantity);

  return totalOldCost.plus(totalNewCost).div(totalQuantity);
}

export function computeCurrentValue(
  quantity: Prisma.Decimal,
  currentPrice: Prisma.Decimal,
): number {
  return Number(quantity) * Number(currentPrice);
}

export function computeGainLossPercent(
  currentPrice: Prisma.Decimal,
  buyPrice: Prisma.Decimal,
): number {
  if (Number(buyPrice) === 0) {
    return 0;
  }
  return ((Number(currentPrice) - Number(buyPrice)) / Number(buyPrice)) * 100;
}
