import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from '@/lib/auth';

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

// ─── Groq Extraction Helper ──────────────────────────────────────────────────
async function extractWithGroq(base64Data: string, mimeType: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('GROQ_API_KEY is missing or not configured');
    }

    const prompt = "Analyze this receipt or expense document image and extract the following information. Return ONLY valid JSON. The JSON object must have these exact fields: 'amount' (string, remove currency symbols), 'currency' (e.g., 'USD', 'EUR'), 'description' (detailed description), 'category' (map to 'Food', 'Travel', 'Office', 'Software', 'Training', or 'Other'), 'date' (dd/mm/yyyy), and 'merchant'. If any information cannot be extracted, use 'N/A'.";

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Data}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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

// ─── Retry Helper with Exponential Backoff (Gemini) ─────────────────────────────
async function generateWithGemini(
    model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
    parts: Parameters<typeof model.generateContent>[0],
    maxRetries = 3
) {
    let delay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(parts);
            return result.response.text();
        } catch (error: any) {
            const status = error?.status || error?.response?.status || error?.httpStatusCode;
            const isQuotaZero = status === 429 && detectQuotaZero(error);

            if (isQuotaZero) throw Object.assign(new Error('Quota exceeded'), { isQuotaZero: true, status: 503 });
            if (status !== 429 || attempt === maxRetries) throw error;

            const retryAfter = error?.response?.headers?.get?.('retry-after') || error?.headers?.['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
            await new Promise((res) => setTimeout(res, waitTime));
            delay *= 2;
        }
    }
    throw new Error('Gemini generation failed after multiple retries.'); // Should not be reached if maxRetries is handled
}

// ─── POST Handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file || !file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Valid image file is required' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = file.type;

        const primaryProvider = process.env.OCR_PROVIDER || 'gemini';
        let responseText: string | undefined;
        let usedProvider = primaryProvider;

        try {
            if (primaryProvider === 'groq') {
                responseText = await limitConcurrency(() => extractWithGroq(base64Data, mimeType));
            } else {
                const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = "Analyze this receipt and return JSON with amount, currency, description, category, date, and merchant.";
                responseText = await limitConcurrency(() => generateWithGemini(model, [prompt, { inlineData: { data: base64Data, mimeType } }]));
            }
        } catch (error: any) {
            console.warn(`[OCR] Primary provider ${primaryProvider} failed. Error: ${error.message}`);
            
            // Fallback logic
            try {
                if (primaryProvider === 'gemini') {
                    console.log('[OCR] Falling back to Groq...');
                    usedProvider = 'groq';
                    responseText = await limitConcurrency(() => extractWithGroq(base64Data, mimeType));
                } else {
                    console.log('[OCR] Falling back to Gemini...');
                    usedProvider = 'gemini';
                    const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
                    const prompt = "Analyze this receipt and return JSON with amount, currency, description, category, date, and merchant.";
                    responseText = await limitConcurrency(() => generateWithGemini(model, [prompt, { inlineData: { data: base64Data, mimeType } }]));
                }
            } catch (fallbackError: any) {
                console.error(`[OCR] Fallback failed: ${fallbackError.message}`);
                throw fallbackError;
            }
        }

        if (!responseText) throw new Error('No response from providers');

        // Extract JSON
        let jsonString = responseText;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/{[\s\S]*}/);
        if (jsonMatch) jsonString = jsonMatch[1] || jsonMatch[0];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedData: any = JSON.parse(jsonString);
        if (parsedData.amount && parsedData.amount !== 'N/A') {
            parsedData.amount = parsedData.amount.replace(/[^0-9.]/g, '');
        }

        return NextResponse.json({ ...parsedData, provider: usedProvider }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'OCR service temporarily unavailable. Please try again shortly.' },
            { status: 503 }
        );
    }
}
