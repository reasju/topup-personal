import { TransactionStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createDigiflazzClient, DigiflazzError } from '@/lib/digiflazz/client';
import { mapDigiflazzStatus, isValidTransition } from './status-mapper';
import { generateRefId } from './ref-id';

const DOUBLE_SUBMIT_WINDOW_MS = 45_000;

export class DoubleSubmitError extends Error {
  constructor(public readonly existingRefId: string) {
    super('Duplicate transaction detected within cooldown window');
    this.name = 'DoubleSubmitError';
  }
}

export async function createTransaction(params: {
  userId: string;
  productId: string;
  customerNo: string;
}): Promise<{ refId: string; transactionId: string }> {
  const { userId, productId, customerNo } = params;

  const windowStart = new Date(Date.now() - DOUBLE_SUBMIT_WINDOW_MS);
  const existing = await prisma.transaction.findFirst({
    where: {
      productId,
      customerNo,
      status: { in: [TransactionStatus.PROCESSING, TransactionStatus.PENDING] },
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) throw new DoubleSubmitError(existing.refId);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new Error('Product not found or inactive');

  const refId = generateRefId();
  const digiflazz = createDigiflazzClient();
  const requestPayload = { buyerSkuCode: product.buyerSkuCode, customerNo, refId };

  const tx = await prisma.transaction.create({
    data: {
      refId,
      userId,
      productId,
      customerNo,
      status: TransactionStatus.PROCESSING,
      amount: product.sellPrice,
      rawRequest: { buyer_sku_code: product.buyerSkuCode, customer_no: customerNo, ref_id: refId } as Prisma.InputJsonValue,
    },
  });

  try {
    const result = await digiflazz.topup(requestPayload);
    const status = mapDigiflazzStatus(result.status);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status,
        rc: result.rc,
        providerMessage: result.message,
        serialNumber: result.sn || null,
        providerPrice: result.price ?? null,
        rawResponse: result as Prisma.InputJsonValue,
      },
    });
    return { refId, transactionId: tx.id };
  } catch (err) {
    const isFailed = err instanceof DigiflazzError;
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: isFailed ? TransactionStatus.FAILED : TransactionStatus.PROCESSING,
        providerMessage: err instanceof Error ? err.message : 'Unknown error',
        rc: err instanceof DigiflazzError ? err.rc : null,
        rawResponse: err instanceof DigiflazzError && err.raw != null ? err.raw as Prisma.InputJsonValue : Prisma.JsonNull,
      },
    });
    throw err;
  }
}

export async function checkTransactionStatus(transactionId: string): Promise<TransactionStatus> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { product: { select: { buyerSkuCode: true } } },
  });
  if (!tx) throw new Error('Transaction not found');

  if (tx.status === TransactionStatus.SUCCESS || tx.status === TransactionStatus.FAILED) {
    return tx.status;
  }

  const digiflazz = createDigiflazzClient();
  const result = await digiflazz.checkStatus({
    buyerSkuCode: tx.product.buyerSkuCode,
    customerNo: tx.customerNo,
    refId: tx.refId,
  });
  const newStatus = mapDigiflazzStatus(result.status);

  if (isValidTransition(tx.status, newStatus)) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        rc: result.rc,
        providerMessage: result.message,
        serialNumber: result.sn || null,
        providerPrice: result.price ?? null,
        rawResponse: result as Prisma.InputJsonValue,
      },
    });
    return newStatus;
  }
  return tx.status;
}
