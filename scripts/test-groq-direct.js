const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const apiKey = process.env.GROQ_API_KEY;
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const mimeType = "image/png";

    const modelsToTest = ['meta-llama/llama-4-scout-17b-16e-instruct'];
    let out = "";
    
    for (const model of modelsToTest) {
        out += "Testing: " + model + "\n";
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: "Analyze" },
                                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
                            ],
                        },
                    ],
                }),
            });
            const err = await response.json();
            if (response.ok) {
               out += "SUCCESS for model: " + model + "\n";
            } else {
               out += "FAILED for model: " + model + " ERROR: " + err.error?.message + "\n";
            }
        } catch(err) {
            out += "Error occurred: " + err + "\n";
        }
    }
    fs.writeFileSync('groq-test-output.txt', out);
}
run();
