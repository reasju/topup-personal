import crypto from "crypto";
import { z } from "zod";

// ---- Schemas ----
export const DigiflazzProductSchema = z.object({
  product_name: z.string(),
  category: z.string(),
  brand: z.string(),
  seller_name: z.string().optional(),
  buyer_sku_code: z.string(),
  buyer_product_status: z.boolean(),
  seller_product_status: z.boolean(),
  unlimited_stock: z.boolean(),
  stock: z.number(),
  multi: z.boolean(),
  start_cut_off: z.string().optional(),
  end_cut_off: z.string().optional(),
  desc: z.string().optional(),
  price: z.number(),
});

export const DigiflazzPriceListResponseSchema = z.object({
  data: z.array(DigiflazzProductSchema),
});

export const DigiflazzTransactionResponseSchema = z.object({
  data: z.object({
    ref_id: z.string(),
    customer_no: z.string(),
    buyer_sku_code: z.string(),
    message: z.string(),
    status: z.string(),
    rc: z.string(),
    sn: z.string().optional().default(""),
    price: z.number().optional(),
    tele: z.string().optional(),
    wa: z.string().optional(),
  }),
});

export type DigiflazzProduct = z.infer<typeof DigiflazzProductSchema>;
export type DigiflazzTransactionResponse = z.infer<typeof DigiflazzTransactionResponseSchema>["data"];

// ---- Errors ----
export class DigiflazzError extends Error {
  constructor(
    message: string,
    public readonly rc: string,
    public readonly raw: unknown,
  ) {
    super(message);
    this.name = "DigiflazzError";
  }
}

// ---- Signature helpers ----
export function signTopup(username: string, apiKey: string, refId: string): string {
  return crypto.createHash("md5").update(username + apiKey + refId).digest("hex");
}

export function signPriceList(username: string, apiKey: string): string {
  return crypto.createHash("md5").update(username + apiKey + "pricelist").digest("hex");
}

// ---- Client ----
export class DigiflazzClient {
  private readonly username: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly testing: boolean;

  constructor(opts: {
    username: string;
    apiKey: string;
    baseUrl?: string;
    testing?: boolean;
  }) {
    this.username = opts.username;
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? "https://api.digiflazz.com/v1";
    this.testing = opts.testing ?? false;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new DigiflazzError(
        `Digiflazz returned non-JSON response (HTTP ${res.status})`,
        "PARSE_ERROR",
        null,
      );
    }

    if (!res.ok) {
      const msg = (json as Record<string, Record<string, string>>)?.data?.message ?? `HTTP ${res.status}`;
      const rc = (json as Record<string, Record<string, string>>)?.data?.rc ?? String(res.status);
      throw new DigiflazzError(msg, rc, json);
    }

    return json as T;
  }

  async getPriceList(): Promise<DigiflazzProduct[]> {
    const sign = signPriceList(this.username, this.apiKey);
    const raw = await this.post<unknown>("/price-list", {
      cmd: "prepaid",
      username: this.username,
      sign,
    });
    const parsed = DigiflazzPriceListResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new DigiflazzError("Invalid price list response schema", "SCHEMA_ERROR", raw);
    }
    return parsed.data.data;
  }

  async topup(params: {
    buyerSkuCode: string;
    customerNo: string;
    refId: string;
  }): Promise<DigiflazzTransactionResponse> {
    const sign = signTopup(this.username, this.apiKey, params.refId);
    const body: Record<string, unknown> = {
      username: this.username,
      buyer_sku_code: params.buyerSkuCode,
      customer_no: params.customerNo,
      ref_id: params.refId,
      sign,
    };
    if (this.testing) body.testing = true;

    const raw = await this.post<unknown>("/transaction", body);
    const parsed = DigiflazzTransactionResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new DigiflazzError("Invalid transaction response schema", "SCHEMA_ERROR", raw);
    }
    return parsed.data.data;
  }

  // Check status reuses the topup endpoint with the original params
  async checkStatus(params: {
    buyerSkuCode: string;
    customerNo: string;
    refId: string;
  }): Promise<DigiflazzTransactionResponse> {
    return this.topup(params);
  }
}

export function createDigiflazzClient(): DigiflazzClient {
  const username = process.env.DIGIFLAZZ_USERNAME!;
  const apiKey = process.env.DIGIFLAZZ_API_KEY!;
  const baseUrl = process.env.DIGIFLAZZ_BASE_URL ?? "https://api.digiflazz.com/v1";
  const testing = process.env.DIGIFLAZZ_TESTING === "true";
  return new DigiflazzClient({ username, apiKey, baseUrl, testing });
}