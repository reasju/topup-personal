export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tx = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      user: { select: { name: true, username: true } },
    },
  });

  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ transaction: tx });
}