const fs = require('fs');
const pdf = require('pdf-parse');

async function parse() {
    try {
        const dataBuffer = fs.readFileSync("04 Oct '25 - Problem Statement _ Expense Management (2).pdf");
        const parseFunc = typeof pdf === 'function' ? pdf : (pdf.default || pdf);
        const data = await parseFunc(dataBuffer);
        fs.writeFileSync('problem-statement.txt', data.text);
        console.log("PDF parsed successfully.");
    } catch(err) {
        fs.writeFileSync('pdf-error.txt', err.stack || String(err));
        console.error("Error parsing PDF:", err);
    }
}

parse();
