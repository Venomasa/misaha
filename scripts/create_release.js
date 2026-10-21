const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Get token from git credential
function getGitHubToken() {
    try {
        const out = execSync('git credential fill', {
            input: 'protocol=https\nhost=github.com\n\n',
            encoding: 'utf8'
        });
        const match = out.match(/password=(.+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    } catch (e) {
        console.error('Failed to get token from git credential:', e.message);
    }
    return null;
}

const token = getGitHubToken();
if (!token) {
    console.error('No GitHub token found!');
    process.exit(1);
}

const owner = 'Venomasa';
const repo = 'misaha';
const tagName = 'v1.0.0';
const releaseName = 'مِسَاحَة v1.0.0 — الإصدار الأول الرسمي';
const apkPath = path.resolve('misaha.apk');

if (!fs.existsSync(apkPath)) {
    console.error(`APK not found at ${apkPath}`);
    process.exit(1);
}

const apkSize = fs.statSync(apkPath).size;
console.log(`Found APK: ${apkPath} (${(apkSize / 1024).toFixed(1)} KB)`);

const releaseBody = `## مِسَاحَة (Misaha) — الإصدار الأول الرسمي v1.0.0
تطبيق هندسي كاداسترالي متكامل لحساب وتخطيط المساحات وتقسيم الأراضي ورسم المخططات المعمارية المعتمدة وتعديل الأركان والأوتار والزوايا (Offline 100% / Zero Data).

### أبرز المميزات:
- كروكي الأراضي التفاعلي: رسم وحساب المساحة والمحيط وتعديل الزوايا والأوتار لحظياً.
- حاسبة الأشكال الهندسية: حساب دقيق لـ 12 شكلاً منتظماً وغير منتظم.
- محول المساحات الزراعية: تحويل فوري بين الفدان والقيراط والسهم والمتر المربع والقصبة.
- تصدير المخططات: حفظ مباشر بصيغتي PDF و PNG بجودة هندسية معتمدة ومقياس رسم دقيق.
- واجهة كاملة ثنائية اللغة: دعم تام للغتين العربية والإنجليزية.
- بدون إنترنت: يعمل التطبيق بالكامل دون اتصال أو إعلانات بحجم 177 KB فقط.

### التحميل والتثبيت:
قم بتحميل ملف misaha.apk المرفق أدناه وتثبيته على هاتفك مباشرة.`;

function apiRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data || '{}');
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed, raw: data });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function main() {
    console.log(`=== 1. CREATING GITHUB RELEASE: ${tagName} ===`);
    const createData = JSON.stringify({
        tag_name: tagName,
        target_commitish: 'main',
        name: releaseName,
        body: releaseBody,
        draft: false,
        prerelease: false
    });

    const createRes = await apiRequest({
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/releases`,
        method: 'POST',
        headers: {
            'User-Agent': 'Misaha-Release-Uploader',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(createData)
        }
    }, createData);

    let release = createRes.body;
    if (createRes.statusCode !== 201) {
        if (createRes.statusCode === 422 && release.errors && release.errors.some(e => e.code === 'already_exists')) {
            console.log(`Release ${tagName} already exists, fetching existing release...`);
            const getRes = await apiRequest({
                hostname: 'api.github.com',
                path: `/repos/${owner}/${repo}/releases/tags/${tagName}`,
                method: 'GET',
                headers: {
                    'User-Agent': 'Misaha-Release-Uploader',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            release = getRes.body;
        } else {
            console.error(`Failed to create release (HTTP ${createRes.statusCode}):`, createRes.raw);
            process.exit(1);
        }
    }

    console.log(`Release ID: ${release.id}, URL: ${release.html_url}`);
    const uploadUrl = release.upload_url.replace(/\{(\?.*)?\}/, '');
    const uploadUrlParsed = new URL(uploadUrl);

    console.log(`=== 2. UPLOADING ASSET: misaha.apk ===`);
    // Check if asset already exists in release
    if (release.assets && release.assets.length > 0) {
        for (const asset of release.assets) {
            if (asset.name === 'misaha.apk') {
                console.log(`Asset misaha.apk already exists (ID: ${asset.id}), deleting old asset first...`);
                await apiRequest({
                    hostname: 'api.github.com',
                    path: `/repos/${owner}/${repo}/releases/assets/${asset.id}`,
                    method: 'DELETE',
                    headers: {
                        'User-Agent': 'Misaha-Release-Uploader',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });
                console.log(`[OK] Old asset deleted`);
            }
        }
    }

    const apkBuffer = fs.readFileSync(apkPath);
    const uploadRes = await new Promise((resolve, reject) => {
        const req = https.request({
            hostname: uploadUrlParsed.hostname,
            path: `${uploadUrlParsed.pathname}?name=misaha.apk&label=Misaha%20Android%20APK`,
            method: 'POST',
            headers: {
                'User-Agent': 'Misaha-Release-Uploader',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': apkBuffer.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(apkBuffer);
        req.end();
    });

    if (uploadRes.statusCode === 201) {
        console.log(`[SUCCESS] misaha.apk successfully uploaded to GitHub Release!`);
        console.log(`Asset Download URL: ${uploadRes.body.browser_download_url}`);
        console.log(`Release Page: ${release.html_url}`);
    } else {
        console.error(`Upload failed with status code ${uploadRes.statusCode}:`, uploadRes.body || uploadRes.raw);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
