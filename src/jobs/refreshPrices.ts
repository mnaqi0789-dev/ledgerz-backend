import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchPrice(assetName: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${assetName.toLowerCase()}&vs_currencies=usd`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
const price = (data as Record<string, { usd: number }>)?.[
  assetName.toLowerCase()
]?.usd;

    return typeof price === "number" ? price : null;
  } catch (err) {
    console.error(`Failed to fetch price for ${assetName}`, err);
    return null;
  }
}

async function refreshAllPrices() {
  const holdings = await prisma.treasuryHolding.findMany();

  for (const holding of holdings) {
    const price = await fetchPrice(holding.assetName);

    if (price === null) {
      continue;
    }

    await prisma.treasuryHolding.update({
      where: { id: holding.id },
      data: {
        currentPrice: price,
        lastPriceUpdate: new Date(),
      },
    });
  }
}

export function startPriceRefreshJob() {
  cron.schedule("*/15 * * * *", () => {
    refreshAllPrices().catch((err) => {
      console.error("Price refresh job failed", err);
    });
  });
}
