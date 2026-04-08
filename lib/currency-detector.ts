const SYMBOL_MAP: Record<string, string> = {
  "$": "USD", "£": "GBP", "€": "EUR", "₹": "INR", "¥": "JPY", "₺": "TRY", "₴": "UAH",
  "₩": "KRW", "R$": "BRL", "A$": "AUD", "C$": "CAD", "NZ$": "NZD", "HK$": "HKD",
  "S$": "SGD", "R": "ZAR", "Fr": "CHF", "kr": "SEK", "Kč": "CZK", "zł": "PLN",
  "฿": "THB", "RM": "MYR", "₱": "PHP", "Rp": "IDR", "₫": "VND", "₦": "NGN",
  "KSh": "KES", "AED": "AED", "SAR": "SAR", "QAR": "QAR",
};

const VALID_ISO = new Set([
  "USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NOK", "DKK",
  "NZD", "SGD", "HKD", "KRW", "BRL", "ZAR", "MXN", "TRY", "AED", "SAR", "THB", "MYR",
  "IDR", "PHP", "VND", "NGN", "KES", "EGP", "QAR", "CZK", "PLN", "HUF", "RON", "ILS",
  "UAH", "CLP", "COP", "PEN", "ARS", "PKR", "BDT", "LKR", "KZT",
]);

export function detectCurrency(
  aiCurrency: string | null | undefined,
  rawText?: string,
  defaultCurrency = "USD"
): string {
  if (aiCurrency) {
    const t = aiCurrency.trim();
    if (/^[A-Z]{3}$/.test(t) && VALID_ISO.has(t)) return t;
    if (SYMBOL_MAP[t]) return SYMBOL_MAP[t];
    const sorted = Object.keys(SYMBOL_MAP).sort((a, b) => b.length - a.length);
    for (const sym of sorted) {
      if (t.includes(sym)) return SYMBOL_MAP[sym];
    }
  }

  if (rawText) {
    const codeMatch = rawText.match(/\b([A-Z]{3})\b/);
    if (codeMatch && VALID_ISO.has(codeMatch[1])) return codeMatch[1];
    const sorted = Object.keys(SYMBOL_MAP).sort((a, b) => b.length - a.length);
    for (const sym of sorted) {
      if (rawText.includes(sym)) return SYMBOL_MAP[sym];
    }
  }

  return defaultCurrency;
}
