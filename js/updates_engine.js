/* ==========================================================================
   MISAHA 1+ - EXTERNAL INTENT & AUTO-UPDATE ENGINE
   ========================================================================== */

function openExternalUrl(url) {
    if (window.AndroidBridge && typeof window.AndroidBridge.openExternalUrl === 'function') {
        window.AndroidBridge.openExternalUrl(url);
    } else {
        window.open(url, '_blank');
    }
}

async function checkAppUpdates() {
    const btn = document.getElementById('btnCheckUpdates');
    const statusDiv = document.getElementById('updateStatusText');
    const isEn = (AppSettings.lang === 'en');
    const defaultDownloadUrl = 'https://github.com/Venomasa/misaha/releases/latest/download/misaha.apk';

    if (statusDiv) {
        statusDiv.innerHTML = isEn 
            ? '<span style="color:#38bdf8;">Checking for latest version on GitHub...</span>' 
            : '<span style="color:#38bdf8;">جاري التحقق من أحدث نسخة عبر GitHub...</span>';
    }

    try {
        const res = await fetch('https://api.github.com/repos/Venomasa/misaha/releases/latest', { cache: 'no-store' });
        if (!res.ok) {
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="margin-top:8px;">
                        <button onclick="openExternalUrl('${defaultDownloadUrl}')" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#ffffff; border:none; border-radius:8px; padding:9px 18px; font-weight:800; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.3);">
                            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                            ${isEn ? 'Download Latest APK (Direct)' : 'تحميل أحدث نسخة APK مباشرة'}
                        </button>
                    </div>
                `;
            }
            showToast(isEn ? 'Opening download link...' : 'جاري فتح رابط التحميل المباشر...', 'info');
            openExternalUrl(defaultDownloadUrl);
            return;
        }

        const data = await res.json();
        const latestTag = data.tag_name || 'v1.0.0';
        let downloadUrl = defaultDownloadUrl;
        if (data.assets && data.assets.length > 0) {
            const apkAsset = data.assets.find(a => a.name && a.name.endsWith('.apk'));
            if (apkAsset && apkAsset.browser_download_url) {
                downloadUrl = apkAsset.browser_download_url;
            }
        }

        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="color:#38bdf8; font-weight:800; margin-bottom:8px;">
                    ${isEn ? `Latest Release: ${latestTag}` : `أحدث نسخة متوفرة: ${latestTag}`}
                </div>
                <button onclick="openExternalUrl('${downloadUrl}')" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#ffffff; border:none; border-radius:8px; padding:9px 18px; font-weight:800; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.3);">
                    <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    ${isEn ? `Download ${latestTag} Now` : `تنزيل الإصدار ${latestTag} الآن`}
                </button>
            `;
        }

        showToast(isEn ? `Starting download for ${latestTag}...` : `جاري بدء تنزيل أحدث نسخة ${latestTag}...`, 'success');
        setTimeout(() => {
            openExternalUrl(downloadUrl);
        }, 400);

    } catch (err) {
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="margin-top:8px;">
                    <button onclick="openExternalUrl('${defaultDownloadUrl}')" style="background:#1e293b; color:#38bdf8; border:1px solid #38bdf8; border-radius:8px; padding:9px 18px; font-weight:800; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                        ${isEn ? 'Download APK (Fallback Link)' : 'تنزيل التحديث مباشرة (رابط بديل)'}
                    </button>
                </div>
            `;
        }
        showToast(isEn ? 'Opening download page...' : 'جاري فتح رابط التحميل المباشر...', 'info');
        openExternalUrl(defaultDownloadUrl);
    }
}
