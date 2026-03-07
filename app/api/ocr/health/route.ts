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
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ status: "error", reason: "missing_api_key" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Simple ping to check if API is responsive and not rate limited (quota zero)
        const result = await model.generateContent("ping");

        if (result && result.response) {
            return NextResponse.json({ status: "ok" }, { status: 200 });
        }

        return NextResponse.json({ status: "error", reason: "empty_response" }, { status: 500 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        const status = error?.status || error?.response?.status || error?.httpStatusCode;

        if (status === 429 && detectQuotaZero(error)) {
            return NextResponse.json({ status: "degraded", reason: "quota_zero" }, { status: 200 });
        }

        console.error("[OCR Health] Check failed:", error.message || error);

        if (status === 429) {
            return NextResponse.json({ status: "degraded", reason: "rate_limited" }, { status: 200 });
        }

        return NextResponse.json({ status: "error", reason: error.message || "unknown" }, { status: 500 });
    }
}
