/* ==========================================================================
   MISAHA 1+ - EXTERNAL INTENT & SMART AUTO-UPDATE ENGINE
   ========================================================================== */

const CURRENT_APP_VERSION = '1.0.0';

function openExternalUrl(url) {
    if (window.AndroidBridge && typeof window.AndroidBridge.openExternalUrl === 'function') {
        window.AndroidBridge.openExternalUrl(url);
    } else {
        window.open(url, '_blank');
    }
}

function parseSemVer(str) {
    if (!str) return [0, 0, 0];
    const match = String(str).match(/(\d+)\.(\d+)\.?(\d+)?/);
    if (!match) return [0, 0, 0];
    return [
        parseInt(match[1], 10) || 0,
        parseInt(match[2], 10) || 0,
        parseInt(match[3], 10) || 0
    ];
}

function isNewerVersion(remoteTag, currentVer = CURRENT_APP_VERSION) {
    const remote = parseSemVer(remoteTag);
    const current = parseSemVer(currentVer);
    for (let i = 0; i < 3; i++) {
        if (remote[i] > current[i]) return true;
        if (remote[i] < current[i]) return false;
    }
    return false;
}

async function checkAppUpdates() {
    const btn = document.getElementById('btnCheckUpdates');
    const statusDiv = document.getElementById('updateStatusText');
    const isEn = (AppSettings.lang === 'en');
    const defaultDownloadUrl = 'https://github.com/Venomasa/misaha/releases/latest/download/misaha.apk';
    const releasesWebUrl = 'https://github.com/Venomasa/misaha/releases';

    if (btn) btn.disabled = true;

    if (statusDiv) {
        statusDiv.innerHTML = isEn 
            ? '<span style="color:#38bdf8;">Checking for latest version on GitHub...</span>' 
            : '<span style="color:#38bdf8;">جاري التحقق من أحدث نسخة عبر GitHub...</span>';
    }

    try {
        const res = await fetch('https://api.github.com/repos/Venomasa/misaha/releases/latest', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const latestTag = data.tag_name || 'v1.0.0';
        const hasUpdate = isNewerVersion(latestTag, CURRENT_APP_VERSION);

        if (!hasUpdate) {
            // Already on latest or newer version: DO NOT DOWNLOAD
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="display:inline-flex; align-items:center; gap:6px; color:#10b981; font-weight:800; font-size:0.78rem; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); padding:8px 14px; border-radius:10px; margin-top:6px;">
                        <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#10b981; flex-shrink:0;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        <span>${isEn ? `You are on the latest version (v${CURRENT_APP_VERSION})` : `أنت تستخدم أحدث إصدار متوفر بالفعل (v${CURRENT_APP_VERSION})`}</span>
                    </div>
                `;
            }
            showToast(isEn ? `App is up to date (v${CURRENT_APP_VERSION})` : `أنت تستخدم أحدث إصدار متوفر (v${CURRENT_APP_VERSION})`, 'success');
            return;
        }

        // Newer version is available: Offer download button
        let downloadUrl = defaultDownloadUrl;
        if (data.assets && data.assets.length > 0) {
            const apkAsset = data.assets.find(a => a.name && a.name.endsWith('.apk'));
            if (apkAsset && apkAsset.browser_download_url) {
                downloadUrl = apkAsset.browser_download_url;
            }
        }

        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="margin-top:8px; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:12px 14px; text-align:center;">
                    <div style="color:#38bdf8; font-weight:800; font-size:0.8rem; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#38bdf8;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        <span>${isEn ? `New version available: ${latestTag}` : `تحديث جديد متوفر: ${latestTag}`}</span>
                    </div>
                    <button onclick="openExternalUrl('${downloadUrl}')" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#ffffff; border:none; border-radius:8px; padding:9px 18px; font-weight:800; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.3);">
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                        <span>${isEn ? `Download ${latestTag} Now` : `تنزيل الإصدار ${latestTag} الآن`}</span>
                    </button>
                </div>
            `;
        }

        showToast(isEn ? `New version available: ${latestTag}` : `يوجد تحديث جديد متوفر: ${latestTag}`, 'info');

    } catch (err) {
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="margin-top:6px; color:#f87171; font-size:0.75rem; font-weight:700;">
                    ${isEn ? 'Could not connect to update server. Check your connection.' : 'تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت.'}
                    <div style="margin-top:6px;">
                        <button onclick="openExternalUrl('${releasesWebUrl}')" style="background:#1e293b; color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:8px; padding:6px 14px; font-weight:800; font-size:0.74rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                            ${isEn ? 'View Releases on GitHub' : 'عرض صفحة الإصدارات في المتصفح'}
                        </button>
                    </div>
                </div>
            `;
        }
        showToast(isEn ? 'Unable to check for updates' : 'تعذر التحقق من التحديثات', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}
