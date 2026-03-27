const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const apiKey = process.env.GROQ_API_KEY;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            }
        });

        const data = await response.json();
        const models = data.data.map(m => m.id);
        
        fs.writeFileSync('models-output.txt', "All Models:\n" + models.join('\n'));
    } catch(err) {
        console.error("Error occurred:", err);
    }
}
run();
