const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        console.error('Error: Please set a valid GROQ_API_KEY in .env.local');
        return;
    }

    const imagePath = process.argv[2];
    if (!imagePath) {
        console.error('Usage: node scripts/test-groq.js <path-to-image>');
        return;
    }

    const buffer = fs.readFileSync(imagePath);
    const base64Data = buffer.toString('base64');
    const mimeType = 'image/' + path.extname(imagePath).slice(1);

    console.log(`Testing Groq OCR with: ${imagePath}...`);

    const prompt = "Analyze this receipt or expense document image and extract the following information. Return ONLY valid JSON. The JSON object must have these exact fields: 'amount' (string, remove currency symbols), 'currency' (e.g., 'USD', 'EUR'), 'description' (detailed description), 'category' (map to 'Food', 'Travel', 'Office', 'Software', 'Training', or 'Other'), 'date' (dd/mm/yyyy), and 'merchant'. If any information cannot be extracted, use 'N/A'.";

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview',
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
            const error = await response.json();
            throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('--- Extracted Data ---');
        console.log(JSON.stringify(JSON.parse(data.choices[0].message.content), null, 2));
        console.log('----------------------');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testGroq();
