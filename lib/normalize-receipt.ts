import { normalizeDate } from "./date-normalizer";
import { detectCurrency } from "./currency-detector";
import { detectCategory } from "./category-mapper";

export interface NormalizedReceipt {
  amount: number | null;
  currency: string;
  date: string | null;
  merchant: string | null;
  category: string;
  description: string | null;
  confidence: number | null;
}

export function normalizeReceiptData(
  raw: Record<string, unknown>,
  rawOcrText?: string
): NormalizedReceipt {
  return {
    amount: typeof raw.amount === "number"
      ? raw.amount
      : raw.amount ? parseFloat(String(raw.amount)) || null : null,
    currency: detectCurrency(raw.currency as string, rawOcrText),
    date: normalizeDate(raw.date as string),
    merchant: (raw.merchant as string) ?? null,
    category: detectCategory(
      raw.category as string,
      raw.merchant as string,
      raw.description as string
    ),
    description: (raw.description as string) ?? null,
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
  };
}
