import crypto from "crypto";
import { z } from "zod";

export const WebhookPayloadSchema = z.object({
  data: z.object({
    ref_id: z.string(),
    customer_no: z.string(),
    buyer_sku_code: z.string(),
    message: z.string(),
    status: z.string(),
    rc: z.string(),
    sn: z.string().optional().default(""),
    price: z.number().optional(),
  }),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = "sha1=" + crypto.createHmac("sha1", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
