import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { ProductsClient } from "@/components/forms/ProductsClient";
import { SyncButton } from "@/components/forms/SyncButton";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await auth();
  const isOwner = session?.user?.role === Role.OWNER;

  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { brand: "asc" }, { price: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produk</h1>
        {isOwner && <SyncButton />}
      </div>
      <ProductsClient products={products} isOwner={isOwner} />
    </div>
  );
}