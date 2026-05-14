import { prisma } from "@/lib/db";
import { createDigiflazzClient } from "./client";

export async function syncPriceList(): Promise<{ synced: number; deactivated: number; error?: string }> {
  const client = createDigiflazzClient();

  let products;
  try {
    products = await client.getPriceList();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.syncLog.create({ data: { status: "FAILED", message } });
    throw err;
  }

  const activeCodes = new Set<string>();
  let synced = 0;

  for (const p of products) {
    if (!p.buyer_product_status || !p.seller_product_status) continue;
    activeCodes.add(p.buyer_sku_code);

    const existing = await prisma.product.findUnique({
      where: { buyerSkuCode: p.buyer_sku_code },
    });

    if (existing) {
      await prisma.product.update({
        where: { buyerSkuCode: p.buyer_sku_code },
        data: {
          name: p.product_name,
          category: p.category,
          brand: p.brand,
          price: p.price,
          provider: p.seller_name ?? "",
          isActive: true,
          // sellPrice intentionally NOT updated
        },
      });
    } else {
      await prisma.product.create({
        data: {
          sku: p.buyer_sku_code,
          buyerSkuCode: p.buyer_sku_code,
          name: p.product_name,
          category: p.category,
          brand: p.brand,
          price: p.price,
          sellPrice: Math.ceil(p.price * 1.05), // default 5% margin for new products
          provider: p.seller_name ?? "",
          isActive: true,
        },
      });
    }
    synced++;
  }

  // Deactivate products no longer in Digiflazz active list
  const deactivateResult = await prisma.product.updateMany({
    where: {
      buyerSkuCode: { notIn: Array.from(activeCodes) },
      isActive: true,
    },
    data: { isActive: false },
  });

  await prisma.syncLog.create({
    data: {
      status: "SUCCESS",
      syncedCount: synced,
      message: `Synced ${synced}, deactivated ${deactivateResult.count}`,
    },
  });

  return { synced, deactivated: deactivateResult.count };
}
