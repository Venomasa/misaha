const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const bodyStart = html.indexOf('<body');
const scriptStart = html.lastIndexOf('<script');
const scriptEnd = html.lastIndexOf('</script>');

const body = html.substring(bodyStart, scriptStart);
const trailing = html.substring(scriptEnd + 9, html.lastIndexOf('</body>'));
const fullMarkup = body + '\n' + trailing;

const regex = />([^<]*[\u0600-\u06FF]+[^<]*)</g;
let match;
let count = 0;
const results = [];
while ((match = regex.exec(fullMarkup)) !== null) {
    const text = match[1].trim();
    const idx = match.index;
    const tagStart = fullMarkup.lastIndexOf('<', idx);
    const tag = fullMarkup.substring(tagStart, idx + 1);
    if (!tag.includes('data-i18n')) {
        count++;
        results.push({ count, text, tag: tag.replace(/\s+/g, ' ').substring(0, 70) });
    }
}
console.log('Total untranslated Arabic text nodes in index.html:', results.length);
results.forEach(r => console.log(`[${r.count}] "${r.text}" in tag: ${r.tag}`));
