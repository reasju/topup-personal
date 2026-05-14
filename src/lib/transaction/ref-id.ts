import crypto from "crypto";

export function generateRefId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `TXN-${ts}-${rand}`;
}
