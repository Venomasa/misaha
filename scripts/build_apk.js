const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = 'D:/Coding/arabic-land-measurer';
const buildDir = path.join(projectDir, 'android-build');
const javaHome = 'C:/Program Files/Eclipse Adoptium/jdk-17.0.20.101-hotspot';
const jdkBin = path.join(javaHome, 'bin');
const sdkTools = 'C:/Android/sdk/build-tools/34.0.0';
const androidJar = 'C:/Android/sdk/platforms/android-34/android.jar';

const env = Object.assign({}, process.env, {
    JAVA_HOME: javaHome,
    PATH: `${jdkBin};${sdkTools};${process.env.PATH}`
});

function run(cmd, cwd = buildDir) {
    console.log('RUNNING:', cmd);
    const out = execSync(cmd, { cwd, env, encoding: 'utf8', stdio: 'pipe' });
    if (out.trim()) console.log(out.trim());
}

console.log('=== 1. PREPARING ANDROID BUILD DIRECTORY ===');
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
}

const mipmaps = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
const dirs = [
    buildDir,
    path.join(buildDir, 'res', 'values'),
    path.join(buildDir, 'res', 'drawable'),
    ...mipmaps.map(m => path.join(buildDir, 'res', m)),
    path.join(buildDir, 'assets'),
    path.join(buildDir, 'assets', 'css'),
    path.join(buildDir, 'assets', 'js'),
    path.join(buildDir, 'src', 'com', 'venomasa', 'misaha'),
    path.join(buildDir, 'gen'),
    path.join(buildDir, 'obj'),
    path.join(buildDir, 'bin')
];
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// 1. AndroidManifest.xml
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.venomasa.misaha"
    android:versionCode="103"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
fs.writeFileSync(path.join(buildDir, 'AndroidManifest.xml'), manifest, 'utf8');

// 2. strings.xml
const strings = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">مِسَاحَة</string>
</resources>`;
fs.writeFileSync(path.join(buildDir, 'res', 'values', 'strings.xml'), strings, 'utf8');

// 3. styles.xml
const styles = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:statusBarColor">#090e1a</item>
        <item name="android:navigationBarColor">#090e1a</item>
        <item name="android:windowBackground">#090e1a</item>
    </style>
</resources>`;
fs.writeFileSync(path.join(buildDir, 'res', 'values', 'styles.xml'), styles, 'utf8');

// 4. Copy High-Resolution Mipmap PNG Icons (The approved golden compass cadastral logo!)
const iconMap = {
    'mipmap-mdpi': 'icon-48.png',
    'mipmap-hdpi': 'icon-72.png',
    'mipmap-xhdpi': 'icon-96.png',
    'mipmap-xxhdpi': 'icon-144.png',
    'mipmap-xxxhdpi': 'icon-192.png'
};

for (const [folder, iconFile] of Object.entries(iconMap)) {
    const srcIcon = path.join(projectDir, 'res', 'icons', iconFile);
    const destIcon = path.join(buildDir, 'res', folder, 'ic_launcher.png');
    if (fs.existsSync(srcIcon)) {
        fs.copyFileSync(srcIcon, destIcon);
        console.log(`[OK] Copied ${iconFile} -> ${folder}/ic_launcher.png`);
    } else {
        console.warn(`[WARN] Missing icon: ${srcIcon}`);
    }
}

// 5. Copy Web Assets into APK Assets
fs.copyFileSync(path.join(projectDir, 'index.html'), path.join(buildDir, 'assets', 'index.html'));
fs.copyFileSync(path.join(projectDir, 'css', 'style.css'), path.join(buildDir, 'assets', 'css', 'style.css'));

const jsFiles = ['i18n.js', 'geometry.js', 'conversions.js', 'fixed_shapes.js', 'pdf_engine.js', 'blueprint.js', 'app.js', 'updates_engine.js'];
jsFiles.forEach(f => {
    fs.copyFileSync(path.join(projectDir, 'js', f), path.join(buildDir, 'assets', 'js', f));
});
console.log('[OK] All web assets copied into APK assets directory');

// 6. MainActivity.java with AndroidBridge (file saving, sharing, and printing)
const javaSrc = `package com.venomasa.misaha;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#090e1a"));

        mWebView = new WebView(this);
        setContentView(mWebView);

        WebSettings s = mWebView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setDatabaseEnabled(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);

        // Memory & Performance Optimization:
        // Assets are bundled locally; disable redundant disk/RAM HTTP caching
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setGeolocationEnabled(false);
        s.setSaveFormData(false);
        s.setSavePassword(false);

        mWebView.setBackgroundColor(Color.parseColor("#090e1a"));
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("fb://") || url.startsWith("linkedin://"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }
        });
        mWebView.setWebChromeClient(new WebChromeClient());

        // Register AndroidBridge
        mWebView.addJavascriptInterface(new AndroidBridge(this, mWebView), "AndroidBridge");

        mWebView.loadUrl("file:///android_asset/index.html");
    }

    public static class AndroidBridge {
        private final Context mContext;
        private final WebView mWebView;

        public AndroidBridge(Context context, WebView webView) {
            this.mContext = context;
            this.mWebView = webView;
        }

        @JavascriptInterface
        public void saveBase64File(final String base64Data, final String filename, final String mimeType) {
            ((Activity) mContext).runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);

                        // Save to Public Downloads folder or external files dir
                        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                        if (!dir.exists()) dir.mkdirs();
                        File outFile = new File(dir, filename);

                        FileOutputStream fos = new FileOutputStream(outFile);
                        fos.write(fileBytes);
                        fos.flush();
                        fos.close();

                        Toast.makeText(mContext, "تم حفظ الملف بنجاح: " + filename, Toast.LENGTH_LONG).show();

                        // Share / Open File Intent
                        try {
                            Intent sendIntent = new Intent(Intent.ACTION_SEND);
                            sendIntent.setType(mimeType);
                            sendIntent.putExtra(Intent.EXTRA_STREAM, Uri.fromFile(outFile));
                            sendIntent.putExtra(Intent.EXTRA_SUBJECT, filename);
                            mContext.startActivity(Intent.createChooser(sendIntent, "مشاركة المخطط"));
                        } catch (Exception ignored) {}

                    } catch (Exception e) {
                        Toast.makeText(mContext, "خطأ في حفظ الملف: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void printPdf() {
            ((Activity) mContext).runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        PrintManager printManager = (PrintManager) mContext.getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null) {
                            PrintDocumentAdapter printAdapter = mWebView.createPrintDocumentAdapter("Misaha_Blueprint");
                            printManager.print("مخطط كروكي مساحة", printAdapter, new PrintAttributes.Builder().build());
                        }
                    } catch (Exception e) {
                        Toast.makeText(mContext, "خطأ أثناء الطباعة: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void openExternalUrl(final String url) {
            ((Activity) mContext).runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        mContext.startActivity(intent);
                    } catch (Exception e) {
                        Toast.makeText(mContext, "تعذر فتح الرابط الخارجي", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
            mWebView.pauseTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
            mWebView.resumeTimers();
        }
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        if (mWebView != null && level >= TRIM_MEMORY_MODERATE) {
            mWebView.clearCache(true);
        }
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        if (mWebView != null) {
            mWebView.clearCache(true);
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.loadUrl("about:blank");
            mWebView.stopLoading();
            mWebView.setWebChromeClient(null);
            mWebView.setWebViewClient(null);
            mWebView.destroy();
            mWebView = null;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`;
fs.writeFileSync(path.join(buildDir, 'src', 'com', 'venomasa', 'misaha', 'MainActivity.java'), javaSrc, 'utf8');

console.log('=== 2. AAPT2 COMPILE & LINK ===');
run(`"${sdkTools}/aapt2.exe" compile --dir res -o res.zip`);
run(`"${sdkTools}/aapt2.exe" link -I "${androidJar}" --manifest AndroidManifest.xml -A assets -o base.apk res.zip --java gen --auto-add-overlay`);

console.log('=== 3. JAVAC COMPILATION ===');
run(`"${jdkBin}/javac.exe" -encoding UTF-8 --release 8 -cp "${androidJar}" -d obj gen/com/venomasa/misaha/R.java src/com/venomasa/misaha/MainActivity.java`);

console.log('=== 4. D8 (DEX GENERATION) ===');
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) results = results.concat(getFiles(full));
        else if (file.endsWith('.class')) results.push(full);
    });
    return results;
}
const classFiles = getFiles(path.join(buildDir, 'obj')).map(f => `"${f}"`).join(' ');
run(`"${sdkTools}/d8.bat" --lib "${androidJar}" --output bin/ ${classFiles}`);

console.log('=== 5. ADD DEX TO BASE.APK ===');
fs.copyFileSync(path.join(buildDir, 'bin', 'classes.dex'), path.join(buildDir, 'classes.dex'));
run(`"${jdkBin}/jar.exe" uf base.apk classes.dex`);

console.log('=== 6. ZIPALIGN ===');
const alignedApk = path.join(buildDir, 'aligned.apk');
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
run(`"${sdkTools}/zipalign.exe" -v -p 4 base.apk aligned.apk`);

console.log('=== 7. KEYSTORE & SIGNING ===');
const keystoreDir = path.join(projectDir, 'keystore');
if (!fs.existsSync(keystoreDir)) {
    fs.mkdirSync(keystoreDir, { recursive: true });
}
const keystorePath = path.join(keystoreDir, 'misaha-release.keystore');
const keyAlias = 'misahakey';
const keyPass = 'misaha2026';

if (!fs.existsSync(keystorePath)) {
    console.log('[PERMANENT] Creating permanent release keystore for seamless updates...');
    run(`"${jdkBin}/keytool.exe" -genkey -v -keystore "${keystorePath}" -storepass ${keyPass} -alias ${keyAlias} -keypass ${keyPass} -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Misaha, OU=Venomasa, O=Venomasa, C=EG"`, projectDir);
} else {
    console.log('[PERMANENT] Using persistent release keystore:', keystorePath);
}

const finalApk = path.join(projectDir, 'misaha.apk');
if (fs.existsSync(finalApk)) fs.unlinkSync(finalApk);

run(`"${sdkTools}/apksigner.bat" sign --ks "${keystorePath}" --ks-pass pass:${keyPass} --ks-key-alias ${keyAlias} --key-pass pass:${keyPass} --out "${finalApk}" aligned.apk`);

console.log('=== 8. VERIFY APK SIGNATURE ===');
run(`"${sdkTools}/apksigner.bat" verify --verbose "${finalApk}"`);

console.log('=============================================');
console.log('BUILD COMPLETE! APK GENERATED AT:', finalApk);
const stats = fs.statSync(finalApk);
console.log('APK FILE SIZE:', (stats.size / 1024).toFixed(1), 'KB');
console.log('=============================================');

// Clean up build directory
fs.rmSync(buildDir, { recursive: true, force: true });
console.log('[OK] Cleaned up temporary android-build directory');
