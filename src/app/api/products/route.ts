import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSellPriceSchema = z.object({
  id: z.string().cuid(),
  sellPrice: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const activeOnly = searchParams.get("activeOnly") !== "false";

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(brand ? { brand } : {}),
      ...(activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ category: "asc" }, { brand: "asc" }, { price: "asc" }],
  });

  return NextResponse.json({ products });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSellPriceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: parsed.data.id },
    data: { sellPrice: parsed.data.sellPrice },
  });

  return NextResponse.json({ product });
}