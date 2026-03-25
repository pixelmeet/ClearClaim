import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is required for OCR');
  }
  return new GoogleGenerativeAI(key);
}

// ─── Concurrency Protection (Per-Process) ────────────────────────────────────
// Note: This is per-process only and won't protect against horizontal scaling
// or multi-instance deployments like serverless functions. 
// For production, consider a distributed queue like BullMQ + Redis.
let activeRequests = 0;
const MAX_CONCURRENT = 2;

async function limitConcurrency<T>(fn: () => Promise<T>): Promise<T> {
    while (activeRequests >= MAX_CONCURRENT) {
        await new Promise((r) => setTimeout(r, 100));
    }

    activeRequests++;
    console.log(`[OCR] Active requests: ${activeRequests}/${MAX_CONCURRENT}`);

    try {
        return await fn();
    } finally {
        activeRequests--;
        console.log(`[OCR] Request finished. Active requests: ${activeRequests}/${MAX_CONCURRENT}`);
    }
}

// ─── Quota Check Helper ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectQuotaZero(err: any): boolean {
    try {
        const s = JSON.stringify(err);
        if (s.includes('"quota_limit_value":"0"') || s.includes('"quota_limit_value":0')) return true;

        const details =
            err?.errorDetails ||
            err?.response?.errorDetails ||
            err?.response?.data?.error?.details ||
            err?.error?.details;

        if (Array.isArray(details)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return details.some((d: any) => {
                const v = d?.metadata?.quota_limit_value;
                return v === "0" || v === 0;
            });
        }
    } catch { }
    return false;
}

// ─── Retry Helper with Exponential Backoff ──────────────────────────────────────
async function generateWithRetry(
    model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
    parts: Parameters<typeof model.generateContent>[0],
    maxRetries = 5
) {
    let delay = 1000; // start with 1 second

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(parts);
            if (attempt > 0) {
                console.log(`[OCR] Gemini request succeeded on attempt ${attempt + 1}`);
            }
            return result;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const status = error?.status || error?.response?.status || error?.httpStatusCode;
            const isQuotaZero = status === 429 && detectQuotaZero(error);

            if (isQuotaZero) {
                console.error('[OCR] Quota is 0. Aborting retries.');
                const e = new Error('Gemini API quota is 0 for this project/region.');
                throw Object.assign(e, {
                    customStatus: 503,
                    isQuotaZero: true,
                    customMessage: 'Gemini API quota is 0 for this project/region. Enable billing or request quota in Google Cloud / AI Studio.'
                });
            }

            const totalAttempts = maxRetries + 1;

            if (status !== 429 || attempt === maxRetries) {
                console.error(`[OCR] Gemini request failed permanently after ${attempt + 1}/${totalAttempts}. Status: ${status || 'unknown'}`);
                throw error;
            }

            // Respect Retry-After header if present
            const retryAfter = error?.response?.headers?.get?.('retry-after')
                || error?.headers?.['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

            console.warn(`[OCR] Rate limited (429). Attempt ${attempt + 1}/${totalAttempts}. Retrying in ${waitTime}ms...`);

            await new Promise((res) => setTimeout(res, waitTime));
            delay *= 2; // exponential backoff
        }
    }
}

// ─── POST Handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY environment variable is missing' },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Uploaded file must be an image' }, { status: 400 });
        }

        const MAX_BYTES = 4 * 1024 * 1024; // 4MB
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'Image too large. Please upload a smaller photo.' }, { status: 413 });
        }

        // Convert the image to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');

        const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = "Analyze this receipt or expense document image and extract the following information. Return ONLY valid minified JSON. No markdown, no code fences. The JSON object must have these exact fields: 'amount' (string, remove currency symbols), 'currency' (e.g., 'USD', 'EUR'), 'description' (detailed description), 'category' (map to 'Food', 'Travel', 'Office', 'Software', 'Training', or 'Other'), 'date' (dd/mm/yyyy), and 'merchant'. If any information cannot be extracted, use 'N/A'.";

        const imageParts = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            },
        ];

        // Use concurrency limiter + retry with exponential backoff
        const result = await limitConcurrency(() =>
            generateWithRetry(model, [prompt, ...imageParts])
        );

        if (!result) {
            console.error('[OCR] generateWithRetry returned undefined after all retries.');
            return NextResponse.json(
                { error: 'OCR service temporarily unavailable. Please try again shortly.' },
                { status: 503 }
            );
        }

        const responseText = result.response.text();

        // Extract JSON from the markdown code block if present
        let jsonString = responseText;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            jsonString = jsonMatch[1];
        } else {
            const rawJsonMatch = responseText.match(/{[\s\S]*}/);
            if (rawJsonMatch) {
                jsonString = rawJsonMatch[0];
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedData: any;
        try {
            parsedData = JSON.parse(jsonString);
        } catch {
            console.error('[OCR] Failed to parse JSON. Raw (first 500 chars):', responseText.slice(0, 500));
            return NextResponse.json({ error: 'OCR returned invalid data. Try another image.' }, { status: 422 });
        }

        // Clean up the amount field
        if (parsedData.amount && parsedData.amount !== 'N/A') {
            const cleanedAmount = parsedData.amount.replace(/[^0-9.]/g, '');
            parsedData.amount = cleanedAmount;
        }

        return NextResponse.json(parsedData, { status: 200 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        const status = error?.status || error?.response?.status || error?.httpStatusCode || error?.customStatus;
        const isQuotaZero = error?.isQuotaZero;

        // Fallback mode if enabled and we hit quota 0 or 429
        if (process.env.OCR_FALLBACK === '1' && (isQuotaZero || status === 429 || status === 503)) {
            console.warn('[OCR] Using fallback OCR response due to Gemini API errors or zero quota.');
            return NextResponse.json(
                { merchant: null, amount: null, date: null, items: [], category: null, description: null, note: "Gemini unavailable" },
                { status: 200 }
            );
        }

        if (isQuotaZero) {
            return NextResponse.json(
                { error: error.customMessage || 'Gemini API quota is 0 for this project/region. Enable billing or increase quota in Google AI Studio / Cloud Quotas.' },
                { status: 503 }
            );
        }

        // Handle rate-limit errors that escaped retries
        if (status === 429) {
            console.error('[OCR] Rate limit exceeded even after retries:', error.message);
            return NextResponse.json(
                { error: 'OCR service is currently busy. Please wait a moment and try again.' },
                { status: 429 }
            );
        }

        console.error('[OCR] Error processing receipt:', error.message || error);
        return NextResponse.json(
            { error: 'OCR service temporarily unavailable. Please try again shortly.' },
            { status: 503 }
        );
    }
}
