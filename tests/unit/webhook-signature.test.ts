import { describe, it, expect } from "vitest";
import { verifyWebhookSignature } from "@/lib/digiflazz/webhook";
import crypto from "crypto";

function makeSignature(body: string, secret: string): string {
  return "sha1=" + crypto.createHmac("sha1", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const secret = "my-webhook-secret";
  const body = JSON.stringify({ data: { ref_id: "TXN-123" } });

  it("accepts valid signature", () => {
    const sig = makeSignature(body, secret);
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it("rejects wrong secret", () => {
    const sig = makeSignature(body, "wrong-secret");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(false);
  });

  it("rejects tampered body", () => {
    const sig = makeSignature(body, secret);
    expect(verifyWebhookSignature(body + "x", sig, secret)).toBe(false);
  });

  it("rejects missing signature", () => {
    expect(verifyWebhookSignature(body, "", secret)).toBe(false);
  });

  it("rejects malformed signature (no sha1= prefix)", () => {
    const raw = crypto.createHmac("sha1", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, raw, secret)).toBe(false);
  });
});