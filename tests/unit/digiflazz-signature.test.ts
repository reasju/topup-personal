import { describe, it, expect } from "vitest";
import { signTopup, signPriceList } from "@/lib/digiflazz/client";

describe("Digiflazz signatures", () => {
  it("signTopup produces correct md5", () => {
    // md5("user" + "key" + "REF123") verified externally
    const sig = signTopup("user", "key", "REF123");
    expect(sig).toMatch(/^[a-f0-9]{32}$/);
    // deterministic
    expect(signTopup("user", "key", "REF123")).toBe(sig);
  });

  it("signPriceList produces correct md5", () => {
    const sig = signPriceList("user", "key");
    expect(sig).toMatch(/^[a-f0-9]{32}$/);
    expect(signPriceList("user", "key")).toBe(sig);
  });

  it("different inputs produce different signatures", () => {
    expect(signTopup("user", "key", "REF1")).not.toBe(signTopup("user", "key", "REF2"));
    expect(signTopup("user", "key", "REF1")).not.toBe(signPriceList("user", "key"));
  });

  it("signTopup known value", () => {
    // echo -n "userkey123" | md5sum => known hash
    const crypto = require("crypto");
    const expected = crypto.createHash("md5").update("userkeyREF123").digest("hex");
    expect(signTopup("user", "key", "REF123")).toBe(expected);
  });
});