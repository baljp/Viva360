const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'AUDIT_RESULTS.json');
const reportPath = path.join(__dirname, '../../qa/reports/107_SCREENS_TRIAGE.md');

if (!fs.existsSync(resultsPath)) {
    console.error('AUDIT_RESULTS.json not found');
    process.exit(1);
}

const results = require(resultsPath);
const items = results.placeholder_screens || [];

const falsePositives = items.filter(i => {
    const text = i.text.toLowerCase();
    return text.includes('placeholder=') ||
        text.includes('bioplaceholder') ||
        text.includes('placeholdertext') ||
        text.includes('placeholder.com') ||
        (text.includes('placeholder') && i.file.includes('Input'));
});

const realGaps = items.filter(i => !falsePositives.includes(i));

let md = '# 107 Missing Screens / Placeholders Triage\n\n';
md += '## 🔴 Real Gaps (' + realGaps.length + ')\n';
realGaps.forEach(i => {
    md += '- **' + i.file + ':' + i.line + '** => `' + i.text.trim() + '`\n';
});

md += '\n## 🟢 False Positives (' + falsePositives.length + ')\n';
falsePositives.forEach(i => {
    md += '- **' + i.file + ':' + i.line + '** => `' + i.text.trim() + '`\n';
});

const dir = path.dirname(reportPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(reportPath, md);
console.log(`Triage report created at ${reportPath}`);
