import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTransaction, DoubleSubmitError } from "@/lib/transaction/service";
import { z } from "zod";
import { TransactionStatus } from "@prisma/client";

const createSchema = z.object({
  productId: z.string().cuid(),
  customerNo: z.string().min(1).max(64).regex(/^[0-9a-zA-Z|]+$/, "Invalid customer number format"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createTransaction({
      userId: session.user.id,
      productId: parsed.data.productId,
      customerNo: parsed.data.customerNo,
    });
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err) {
    if (err instanceof DoubleSubmitError) {
      return NextResponse.json(
        { error: "Duplicate transaction", existingRefId: err.existingRefId },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as TransactionStatus | null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where = status && Object.values(TransactionStatus).includes(status) ? { status } : {};

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        product: { select: { name: true, category: true, brand: true } },
        user: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}