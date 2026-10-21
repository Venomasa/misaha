const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Extract TRANSLATIONS from index.html
const tStart = html.indexOf('const TRANSLATIONS = {');
const nextFunc = html.indexOf('function changeAppLanguage', tStart);
const code = html.substring(tStart, nextFunc) + '\nmodule.exports = TRANSLATIONS;';
fs.writeFileSync('scripts/temp_eval_trans.js', code, 'utf8');
const TRANSLATIONS = require('./temp_eval_trans.js');
fs.unlinkSync('scripts/temp_eval_trans.js');

console.log('--- Checking all data-i18n tags in HTML against TRANSLATIONS ---');
const i18nRegex = /data-i18n="([^"]+)"/g;
let m;
const missingInAr = new Set();
const missingInEn = new Set();
let count = 0;

while ((m = i18nRegex.exec(html)) !== null) {
    count++;
    const key = m[1];
    if (!TRANSLATIONS.ar[key]) missingInAr.add(key);
    if (!TRANSLATIONS.en[key]) missingInEn.add(key);
}
console.log('Total data-i18n tags checked:', count);
console.log('Missing in AR:', Array.from(missingInAr));
console.log('Missing in EN:', Array.from(missingInEn));

console.log('\n--- Checking all data-i18n-title tags in HTML against TRANSLATIONS ---');
const titleRegex = /data-i18n-title="([^"]+)"/g;
const titleMissingInAr = new Set();
const titleMissingInEn = new Set();
let titleCount = 0;

while ((m = titleRegex.exec(html)) !== null) {
    titleCount++;
    const key = m[1];
    if (!TRANSLATIONS.ar[key]) titleMissingInAr.add(key);
    if (!TRANSLATIONS.en[key]) titleMissingInEn.add(key);
}
console.log('Total data-i18n-title tags checked:', titleCount);
console.log('Missing in AR:', Array.from(titleMissingInAr));
console.log('Missing in EN:', Array.from(titleMissingInEn));

// Check JavaScript syntax
console.log('\n--- Checking index.html JavaScript syntax ---');
const scriptStart = html.lastIndexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const script = html.substring(scriptStart + 8, scriptEnd);
try {
    new Function(script);
    console.log('[OK] JavaScript syntax is 100% valid with NO syntax errors!');
} catch (err) {
    console.error('[ERROR] JavaScript syntax error:', err);
    process.exit(1);
}
