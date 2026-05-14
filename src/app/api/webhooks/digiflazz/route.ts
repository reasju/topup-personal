export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { verifyWebhookSignature, WebhookPayloadSchema } from '@/lib/digiflazz/webhook';
import { mapDigiflazzStatus, isValidTransition } from '@/lib/transaction/status-mapper';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') ?? '';
  if (!userAgent.includes('Digiflazz-Hookshot')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const event = req.headers.get('x-digiflazz-event');
  if (!event) {
    return NextResponse.json({ error: 'Missing event header' }, { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature') ?? '';
  const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET ?? '';

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = WebhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload schema' }, { status: 400 });
  }

  const { data } = parsed.data;

  await prisma.webhookEvent.create({
    data: { refId: data.ref_id, event, payload: json as Prisma.InputJsonValue },
  });

  const tx = await prisma.transaction.findUnique({ where: { refId: data.ref_id } });
  if (!tx) {
    return NextResponse.json({ received: true });
  }

  const newStatus = mapDigiflazzStatus(data.status);

  if (isValidTransition(tx.status, newStatus)) {
    await prisma.transaction.update({
      where: { refId: data.ref_id },
      data: {
        status: newStatus,
        rc: data.rc,
        providerMessage: data.message,
        serialNumber: data.sn || null,
        providerPrice: data.price ?? null,
        rawWebhook: json as Prisma.InputJsonValue,
      },
    });
  }

  return NextResponse.json({ received: true });
}
