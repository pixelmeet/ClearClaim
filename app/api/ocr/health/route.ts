import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export async function GET() {
    try {
        const provider = process.env.OCR_PROVIDER || 'gemini';

        if (provider === 'groq') {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey || apiKey === 'your_groq_api_key_here') {
                return NextResponse.json({ status: "error", reason: "missing_groq_api_key" }, { status: 200 });
            }
            // Simple ping for Groq using an available model
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant', // Supported small model for ping
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 1,
                }),
            });

            if (res.ok) return NextResponse.json({ status: "ok" }, { status: 200 });
            
            const err = await res.json().catch(() => ({}));
            if (res.status === 429) return NextResponse.json({ status: "degraded", reason: "rate_limited" }, { status: 200 });
            return NextResponse.json({ status: "error", reason: err.error?.message || "groq_error" }, { status: 200 });
        }

        // Gemini logic
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ status: "error", reason: "missing_gemini_api_key" }, { status: 200 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("ping");

        if (result && result.response) {
            return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        return NextResponse.json({ status: "error", reason: "empty_response" }, { status: 200 });

    } catch (error: any) {
        const status = error?.status || error?.response?.status || error?.httpStatusCode;

        if (status === 429) {
            return NextResponse.json({ status: "degraded", reason: "rate_limited" }, { status: 200 });
        }

        console.error("[OCR Health] Check failed:", error.message || error);
        return NextResponse.json({ status: "error", reason: error.message || "unknown" }, { status: 200 });
    }
}
