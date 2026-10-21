const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== 1. FETCHING CLEAN BASELINE FROM GIT ===');
const origHtml = execSync('git show 13a37fc~1:index.html', { maxBuffer: 50 * 1024 * 1024, encoding: 'utf8' });

// Extract full original CSS
const cssStart = origHtml.indexOf('<style>');
const cssEnd = origHtml.indexOf('</style>', cssStart);
let css = origHtml.substring(cssStart + 7, cssEnd).trim();

// Add helper classes to CSS
css += `
/* Helper styles for settings, about view, and buttons */
.s-label { font-size: 0.88rem; font-weight: 800; color: var(--text-main); }
.s-sub { font-size: 0.72rem; color: var(--text-sub); margin-top: 2px; }
.settings-select { background: #131c2e; border: 1px solid var(--surface-border); color: #ffffff; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; }
.about-name { font-size: 1.25rem; font-weight: 900; color: #ffffff; }
.about-ver { display: inline-block; background: rgba(16, 185, 129, 0.18); border: 1px solid #10b981; color: #10b981; padding: 3px 12px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; margin-top: 4px; }
.btn-dialog-cancel { background: #1e293b; color: var(--text-sub); border: 1px solid var(--surface-border); border-radius: 10px; padding: 10px 18px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.btn-dialog-cancel:hover { background: #334155; color: #ffffff; }
`;
fs.writeFileSync('css/style.css', css, 'utf8');
console.log(`[OK] css/style.css updated: ${css.length} characters`);

// Extract body markup (from <body to <script)
const bodyStart = origHtml.indexOf('<body');
const scriptStart = origHtml.lastIndexOf('<script');
const scriptEnd = origHtml.lastIndexOf('</script>');
let body = origHtml.substring(bodyStart, scriptStart).trim();
let trailingHtml = origHtml.substring(scriptEnd + 9, origHtml.lastIndexOf('</body>')).trim();

// Extract JavaScript
let script = origHtml.substring(scriptStart + 8, scriptEnd).trim();

console.log('=== 2. FIXING HTML MARKUP & LOCALIZATION TAGS ===');

// 2.1 Hero Sqm span
body = body.replace(
    'id="heroSqmVal">0</div>',
    'id="heroSqmVal"><span id="resSqm">0</span></div>'
);

// 2.2 Developer accounts reordering
const targetAccountsStart = body.indexOf('<!-- Vertical Developer Accounts List');
if (targetAccountsStart !== -1) {
    const targetAccountsEnd = body.indexOf('</div>\n            </div>\n        </div>\n    </div>', targetAccountsStart);
    if (targetAccountsEnd !== -1) {
        const newDevList = `<!-- Vertical Developer Accounts List (Facebook & LinkedIn above GitHub) -->
                <div style="margin-top:16px; border-top:1px solid #1e293b; padding-top:14px; text-align:start;">
                    <div style="font-size:0.72rem; color:var(--text-sub); margin-bottom:10px; text-align:center;" data-i18n="devTitle">تطوير وبرمجة م / أحمد صالح (Ahmed Saleh)</div>
                    <div style="display:flex; flex-direction:column; gap:8px; max-width:340px; margin:0 auto;">

                        <!-- 1. Facebook -->
                        <a href="https://www.facebook.com/share/18fmtB895B/" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); openExternalUrl('https://www.facebook.com/share/18fmtB895B/');" style="display:flex; align-items:center; justify-content:space-between; background:#090e17; border:1px solid #1877f2; padding:10px 14px; border-radius:10px; color:#60a5fa; text-decoration:none; transition:all 0.2s;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#1877f2; flex-shrink:0;"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
                                <div>
                                    <div style="font-size:0.65rem; color:#93c5fd;">Facebook</div>
                                    <div style="font-size:0.82rem; font-weight:800; color:#60a5fa;">Ahmed Saleh</div>
                                </div>
                            </div>
                            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#60a5fa;"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </a>

                        <!-- 2. LinkedIn -->
                        <a href="https://www.linkedin.com/in/ahmedsalehaau" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); openExternalUrl('https://www.linkedin.com/in/ahmedsalehaau');" style="display:flex; align-items:center; justify-content:space-between; background:#090e17; border:1px solid #0077b5; padding:10px 14px; border-radius:10px; color:#38bdf8; text-decoration:none; transition:all 0.2s;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#0077b5; flex-shrink:0;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/></svg>
                                <div>
                                    <div style="font-size:0.65rem; color:#93c5fd;">LinkedIn</div>
                                    <div style="font-size:0.82rem; font-weight:800; color:#38bdf8;">Ahmed Saleh</div>
                                </div>
                            </div>
                            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#38bdf8;"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </a>

                        <!-- 3. GitHub Profile -->
                        <a href="https://github.com/Venomasa" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); openExternalUrl('https://github.com/Venomasa');" style="display:flex; align-items:center; justify-content:space-between; background:#090e17; border:1px solid #334155; padding:10px 14px; border-radius:10px; color:#fff; text-decoration:none; transition:all 0.2s;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#fff; flex-shrink:0;"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                                <div>
                                    <div style="font-size:0.65rem; color:var(--text-sub);">GitHub Profile</div>
                                    <div style="font-size:0.82rem; font-weight:800; color:#fff;">Venomasa</div>
                                </div>
                            </div>
                            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:var(--text-sub);"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </a>

                        <!-- 4. GitHub Project Repository -->
                        <a href="https://github.com/Venomasa/misaha" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); openExternalUrl('https://github.com/Venomasa/misaha');" style="display:flex; align-items:center; justify-content:space-between; background:#090e17; border:1px solid #10b981; padding:10px 14px; border-radius:10px; color:#10b981; text-decoration:none; transition:all 0.2s;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#10b981; flex-shrink:0;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l5.59-5.59L19 10l-7 7z"/></svg>
                                <div>
                                    <div style="font-size:0.65rem; color:#a7f3d0;" data-i18n="repoSub">Project Repository</div>
                                    <div style="font-size:0.82rem; font-weight:800; color:#10b981;">Venomasa/misaha</div>
                                </div>
                            </div>
                            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#10b981;"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </a>
                    </div>
                </div>`;
        body = body.substring(0, targetAccountsStart) + newDevList + body.substring(targetAccountsEnd + 4);
        console.log('[OK] Developer accounts reordered');
    }
}

// 2.3 Comprehensive HTML localization tags
// Toolbar open/close
body = body.replace('title="إظهار شريط الأدوات"', 'title="إظهار شريط الأدوات" data-i18n-title="titleShowToolbar"');
body = body.replace('title="إخفاء شريط الأدوات"', 'title="إخفاء شريط الأدوات" data-i18n-title="titleHideToolbar"');
body = body.replace('<span>الأدوات</span>', '<span data-i18n="toolsBtn">الأدوات</span>');
body = body.replace('<span>إخفاء</span>', '<span data-i18n="toolHide">إخفاء</span>');

// Toolbar buttons
body = body.replace('title="تفعيل/تعطيل تحريك الأركان (ON/OFF)"', 'title="تفعيل/تعطيل تحريك الأركان (ON/OFF)" data-i18n-title="titleToggleMove"');
body = body.replace('<span id="toolMoveText">التحريك: تشغيل</span>', '<span id="toolMoveText" data-i18n="toolMove">التحريك: تشغيل</span>');
body = body.replace('title="إضافة ركن/نقطة جديدة"', 'title="إضافة ركن/نقطة جديدة" data-i18n-title="titleAddCorner"');
body = body.replace('<span>+نقطة</span>', '<span data-i18n="toolAdd">+نقطة</span>');
body = body.replace('title="حذف ركن/نقطة"', 'title="حذف ركن/نقطة" data-i18n-title="titleDelCorner"');
body = body.replace('<span>-نقطة</span>', '<span data-i18n="toolDel">-نقطة</span>');
body = body.replace('title="الأوتار والأضلاع الداخلية (تعديل موضع الوتر أو إضافة ضلع داخلي)"', 'title="الأوتار والأضلاع الداخلية (تعديل موضع الوتر أو إضافة ضلع داخلي)" data-i18n-title="titleChords"');
body = body.replace('<span>الأوتار</span>', '<span data-i18n="toolChords">الأوتار</span>');
body = body.replace('title="طباعة أو تصدير الكروكي كصورة أو PDF كلاسيكي"', 'title="طباعة أو تصدير الكروكي كصورة أو PDF كلاسيكي" data-i18n-title="titleExport"');
body = body.replace('<span>تصدير</span>', '<span data-i18n="toolExport">تصدير</span>');
body = body.replace('title="تدوير الشكل 90 درجة لمطابقة الاتجاه الحقلي"', 'title="تدوير الشكل 90 درجة لمطابقة الاتجاه الحقلي" data-i18n-title="titleRotate"');
body = body.replace('<span>تدوير</span>', '<span data-i18n="toolRotate">تدوير</span>');
body = body.replace('title="إظهار / إخفاء شبكة الرسم الهندسية"', 'title="إظهار / إخفاء شبكة الرسم الهندسية" data-i18n-title="titleGrid"');
body = body.replace('<span>شبكة</span>', '<span data-i18n="toolGrid">شبكة</span>');
body = body.replace('title="إعادة ضبط للأبعاد الأصلية"', 'title="إعادة ضبط للأبعاد الأصلية" data-i18n-title="titleReset"');
body = body.replace('<span>ضبط</span>', '<span data-i18n="toolReset">ضبط</span>');

// Status & Quick pill & Zooms
body = body.replace('id="playgroundStatusText">كروكي تفاعلي (اسحب الزوايا أو غيّر الأطوال)</span>', 'id="playgroundStatusText" data-i18n="playgroundStatus">كروكي تفاعلي (اسحب الزوايا أو غيّر الأطوال)</span>');
body = body.replace('<span class="live-preview-pill" id="quickPill">0 م²</span>', '<span class="live-preview-pill" id="quickPill" data-i18n="initQuickPill">0 م²</span>');
body = body.replace('onclick="zoomPlayground(1.2)" title="تكبير">', 'onclick="zoomPlayground(1.2)" title="تكبير" data-i18n-title="titleZoomIn">');
body = body.replace('onclick="zoomPlayground(0.8)" title="تصغير">', 'onclick="zoomPlayground(0.8)" title="تصغير" data-i18n-title="titleZoomOut">');
body = body.replace('onclick="fitPlaygroundView()" title="توسيط وملاءمة">', 'onclick="fitPlaygroundView()" title="توسيط وملاءمة" data-i18n-title="titleFitView">');

// Fixed Shapes Catalog Subtitle & 12 Cards
body = body.replace('<div style="font-size:0.68rem; color:var(--text-sub);">اختر الشكل الهندسي المطلوب لحساب مساحته وأبعاده بدقة</div>', '<div style="font-size:0.68rem; color:var(--text-sub);" data-i18n="fixedShapesSubText">اختر الشكل الهندسي المطلوب لحساب مساحته وأبعاده بدقة</div>');
const shapeCards = [
    ['quad_diag', 'shape_quad_diag', 'shape_quad_diag_badge', 'رباعي بالوتر', 'صيغة هيرون الدقيقة'],
    ['quad_avg', 'shape_quad_avg', 'shape_quad_avg_badge', 'رباعي بالمتوسطات', 'متوسط الطول × العرض'],
    ['trapezoid', 'shape_trapezoid', 'shape_trapezoid_badge', 'شبه منحرف قياسي', 'قاعدتين + ارتفاع'],
    ['trapezoid_right', 'shape_trapezoid_right', 'shape_trapezoid_right_badge', 'شبه منحرف قائم', 'جانب قائم = ارتفاع'],
    ['rect', 'shape_rect', 'shape_rect_badge', 'مستطيل / مربع', 'الطول × العرض'],
    ['triangle', 'shape_triangle', 'shape_triangle_badge', 'مثلث (3 أضلاع)', 'صيغة هيرون'],
    ['triangle_right', 'shape_triangle_right', 'shape_triangle_right_badge', 'مثلث قائم الزاوية', 'قاعدة × ارتفاع ÷ 2'],
    ['parallelogram', 'shape_parallelogram', 'shape_parallelogram_badge', 'متوازي أضلاع', 'قاعدة × ارتفاع عمودي'],
    ['rhombus', 'shape_rhombus', 'shape_rhombus_badge', 'المَعين', 'القطر 1 × القطر 2 ÷ 2'],
    ['l_shape', 'shape_l_shape', 'shape_l_shape_badge', 'أرض زاوية (L)', 'مستطيلان مدمجان'],
    ['t_shape', 'shape_t_shape', 'shape_t_shape_badge', 'أرض شكل حرف T', 'قطعتان متعامدتان'],
    ['pentagon_diag', 'shape_pentagon_diag', 'shape_pentagon_diag_badge', 'خماسي غير منتظم', 'مقسم بوترين لـ 3 مثلثات']
];
shapeCards.forEach(([sType, titleKey, badgeKey, titleAr, badgeAr]) => {
    body = body.replace(`<div class="catalog-shape-title">${titleAr}</div>`, `<div class="catalog-shape-title" data-i18n="${titleKey}">${titleAr}</div>`);
    body = body.replace(`<div class="catalog-shape-badge">${badgeAr}</div>`, `<div class="catalog-shape-badge" data-i18n="${badgeKey}">${badgeAr}</div>`);
});
body = body.replaceAll('<div class="catalog-btn-select">اختيار الشكل</div>', '<div class="catalog-btn-select" data-i18n="selectShapeBtn">اختيار الشكل</div>');

// Shapes Detail View
body = body.replace('title="الرجوع لقائمة الأشكال"', 'title="الرجوع لقائمة الأشكال" data-i18n-title="titleBackCatalog"');
body = body.replace('<span>اختيار شكل آخر</span>', '<span data-i18n="btnChooseOtherShape">اختيار شكل آخر</span>');
body = body.replace('<div class="active-shape-pill" id="activeShapePill">رباعي بالوتر</div>', '<div class="active-shape-pill" id="activeShapePill" data-i18n="shape_quad_diag">رباعي بالوتر</div>');
body = body.replace('<div class="diagram-live-badge" id="diagramLiveBadge">0 م²</div>', '<div class="diagram-live-badge" id="diagramLiveBadge" data-i18n="initQuickPill">0 م²</div>');
body = body.replace('<span>مخطط وتوزيع أطوال الشكل:</span>', '<span data-i18n="diagramLengthsTitle">مخطط وتوزيع أطوال الشكل:</span>');
body = body.replace('<div class="diagram-hint-text">', '<div class="diagram-hint-text" data-i18n="shapesInstruction">');

// Conversions
body = body.replace('id="convFqsSummary">1 فدان و 12 قيراط و 0 سهم</div>', 'id="convFqsSummary" data-i18n="initConvSummary">1 فدان و 12 قيراط و 0 سهم</div>');
body = body.replaceAll('<span class="unit">م²</span>', '<span class="unit" data-i18n="unitSqmShort">م²</span>');
body = body.replaceAll('<span class="unit">قصبة²</span>', '<span class="unit" data-i18n="unitQasabaSqShort">قصبة²</span>');
const stds = [
    ['= 24 قيراط = 4,200.83 م²', 'stdFeddanVal'],
    ['= 24 سهم = 175.035 م²', 'stdQiratVal'],
    ['= 7.293 م²', 'stdSahmVal'],
    ['= 3.55 متر (6 أذرع)', 'stdQasabaLenVal'],
    ['= 12.6025 م²', 'stdQasabaSqVal'],
    ['= 10,000 م² = 2.38 فدان', 'stdHectareVal'],
    ['= 1,000 م² = 0.238 فدان', 'stdDonumVal'],
    ['= 4,046.86 م² = 0.963 فدان', 'stdAcreVal']
];
stds.forEach(([sText, sKey]) => {
    body = body.replace(`<div style="font-size:0.72rem; color:var(--text-sub); margin-top:2px;">${sText}</div>`, `<div style="font-size:0.72rem; color:var(--text-sub); margin-top:2px;" data-i18n="${sKey}">${sText}</div>`);
});

// Settings View
body = body.replace('<option value="ar">العربية (Arabic)</option>', '<option value="ar" data-i18n="langArOpt">العربية (Arabic)</option>');
body = body.replace('<option value="en">English (الإنجليزية)</option>', '<option value="en" data-i18n="langEnOpt">English (الإنجليزية)</option>');
body = body.replace('<span>تفضيلات وحدات القياس الرسمية:</span>', '<span data-i18n="prefUnitsTitle">تفضيلات وحدات القياس الرسمية:</span>');
body = body.replace('<div class="settings-label">الوحدة الرئيسية لعرض النتائج</div>', '<div class="settings-label" data-i18n="primaryUnitLabel">الوحدة الرئيسية لعرض النتائج</div>');
body = body.replace('<div class="settings-subtext">الوحدة المعروضة بشكل بارز في بطاقات القياس والشريط العلوي</div>', '<div class="settings-subtext" data-i18n="primaryUnitSub">الوحدة المعروضة بشكل بارز في بطاقات القياس والشريط العلوي</div>');
body = body.replace('<option value="sqm">متر مربع (م²) - عام وهندسي</option>', '<option value="sqm" data-i18n="unitOptSqm">متر مربع (م²) - عام وهندسي</option>');
body = body.replace('<option value="feddan" selected>فدان + قيراط + سهم (زراعي)</option>', '<option value="feddan" selected data-i18n="unitOptFeddan">فدان + قيراط + سهم (زراعي)</option>');
body = body.replace('<option value="qasaba">قصبة مربعة</option>', '<option value="qasaba" data-i18n="unitOptQasaba">قصبة مربعة</option>');
body = body.replace('<option value="donum">دونم (1,000 م²)</option>', '<option value="donum" data-i18n="unitOptDonum">دونم (1,000 م²)</option>');
body = body.replace('<option value="hectare">هكتار (10,000 م²)</option>', '<option value="hectare" data-i18n="unitOptHectare">هكتار (10,000 م²)</option>');
body = body.replace('<div class="settings-label">دقة التقريب العشري</div>', '<div class="settings-label" data-i18n="decimalLabel">دقة التقريب العشري</div>');
body = body.replace('<div class="settings-subtext">عدد الخانات بعد الفاصلة في الحسابات</div>', '<div class="settings-subtext" data-i18n="decimalSub">عدد الخانات بعد الفاصلة في الحسابات</div>');
body = body.replace('<option value="0">بدون أرقام عشرية (0)</option>', '<option value="0" data-i18n="decimalOpt0">بدون أرقام عشرية (0)</option>');
body = body.replace('<option value="1">رقم عشري واحد (0.0)</option>', '<option value="1" data-i18n="decimalOpt1">رقم عشري واحد (0.0)</option>');
body = body.replace('<option value="2" selected>رقمان عشريان (0.00)</option>', '<option value="2" selected data-i18n="decimalOpt2">رقمان عشريان (0.00)</option>');
body = body.replace('<span>خيارات شاشة الكروكي والرسم:</span>', '<span data-i18n="playgroundOptsTitle">خيارات شاشة الكروكي والرسم:</span>');
body = body.replace('<div class="settings-label">إظهار مسميات الأركان (أ، ب، ج، د...)</div>', '<div class="settings-label" data-i18n="cornerLettersLabel">إظهار مسميات الأركان (أ، ب، ج، د...)</div>');
body = body.replace('<div class="settings-subtext">كتابة حروف الأركان داخل دوائر الرؤوس</div>', '<div class="settings-subtext" data-i18n="cornerLettersSub">كتابة حروف الأركان داخل دوائر الرؤوس</div>');
body = body.replace('<div class="settings-label">التحديد التلقائي للأرقام عند النقر</div>', '<div class="settings-label" data-i18n="autoSelectLabel">التحديد التلقائي للأرقام عند النقر</div>');
body = body.replace('<div class="settings-subtext">تظليل الرقم فور اللمس لكتابة الطول الجديد فورياً</div>', '<div class="settings-subtext" data-i18n="autoSelectSub">تظليل الرقم فور اللمس لكتابة الطول الجديد فورياً</div>');
body = body.replace('<span>الذاكرة وإعادة التعيين:</span>', '<span data-i18n="memoryResetTitle">الذاكرة وإعادة التعيين:</span>');
body = body.replace('استعادة الإعدادات الافتراضية', '<span data-i18n="btnResetDefaults">استعادة الإعدادات الافتراضية</span>');
body = body.replace('class="about-ver"', 'class="about-ver" data-i18n="appVersion"');

// Drawer Items
body = body.replace('<div style="font-size:0.68rem; color:var(--text-sub);">القائمة الرئيسية</div>', '<div style="font-size:0.68rem; color:var(--text-sub);" data-i18n="mainMenu">القائمة الرئيسية</div>');
body = body.replace('<span>الكروكي الحر</span>', '<span data-i18n="navPlaygroundShort">الكروكي الحر</span>');
body = body.replace('<span>حاسبة الأشكال الثابتة</span>', '<span data-i18n="navFixedShapesShort">حاسبة الأشكال الثابتة</span>');
body = body.replace('<span>التحويلات والمعايير</span>', '<span data-i18n="navConversionsShort">التحويلات والمعايير</span>');
body = body.replace('<span>الإعدادات</span>', '<span data-i18n="navSettingsShort">الإعدادات</span>');
body = body.replace('<span>عن المطور والبرنامج</span>', '<span data-i18n="navAboutShort">عن المطور والبرنامج</span>');

// Bottom sheet & Modals
body = body.replace('id="resFeddanText">0 فدان و 0 قيراط و 0 سهم</div>', 'id="resFeddanText" data-i18n="initFeddanSummary">0 فدان و 0 قيراط و 0 سهم</div>');
body = body.replace('id="resPerimeter">0 م</div>', 'id="resPerimeter" data-i18n="initPerimeter">0 م</div>');
body = body.replace('<div class="u-sub">1 قصبة² = 12.6025 م²</div>', '<div class="u-sub" data-i18n="qasabaSqSub">1 قصبة² = 12.6025 م²</div>');
body = body.replace('<div class="u-sub">قيراط صافي (175.04 م²)</div>', '<div class="u-sub" data-i18n="totalQiratSub">قيراط صافي (175.04 م²)</div>');
body = body.replace('<div class="u-sub">سهم صافي (7.293 م²)</div>', '<div class="u-sub" data-i18n="totalSahmSub">سهم صافي (7.293 م²)</div>');
body = body.replace('<div class="u-sub">1 قصبة طولية = 3.55 م</div>', '<div class="u-sub" data-i18n="perimeterQasabaSub">1 قصبة طولية = 3.55 م</div>');

body = body.replace('id="singleEdgeTitle">تعديل طول الضلع:</div>', 'id="singleEdgeTitle" data-i18n="edgeModalTitleWithColon">تعديل طول الضلع:</div>');
body = body.replace('<span class="unit">متر</span>', '<span class="unit" data-i18n="unitMeterLong">متر</span>');
body = body.replace('<button class="btn-dialog-apply" onclick="saveSingleEdgeLength()">', '<button class="btn-dialog-apply" onclick="saveSingleEdgeLength()" data-i18n="btnApplyEdge">');
body = body.replace('<div style="font-size:0.95rem; font-weight:800; color:#ffffff;">الأوتار والأضلاع الداخلية</div>', '<div style="font-size:0.95rem; font-weight:800; color:#ffffff;" data-i18n="chordsModalTitle">الأوتار والأضلاع الداخلية</div>');
body = body.replace('<div style="font-size:0.75rem; color:var(--text-sub); margin-bottom:6px; font-weight:700;">تبديل موضع الوتر الرئيسي:</div>', '<div style="font-size:0.75rem; color:var(--text-sub); margin-bottom:6px; font-weight:700;" data-i18n="chordsSwapMain">تبديل موضع الوتر الرئيسي:</div>');
body = body.replace('<div style="font-size:0.76rem; color:#a7f3d0; margin-bottom:8px; font-weight:800;">+ إضافة ضلع داخلي جديد بين ركنين:</div>', '<div style="font-size:0.76rem; color:#a7f3d0; margin-bottom:8px; font-weight:800;" data-i18n="chordsAddNew">+ إضافة ضلع داخلي جديد بين ركنين:</div>');
body = body.replace('<label style="font-size:0.68rem; color:var(--text-sub);">من ركن:</label>', '<label style="font-size:0.68rem; color:var(--text-sub);" data-i18n="fromCorner">من ركن:</label>');
body = body.replace('<label style="font-size:0.68rem; color:var(--text-sub);">إلى ركن:</label>', '<label style="font-size:0.68rem; color:var(--text-sub);" data-i18n="toCorner">إلى ركن:</label>');
body = body.replace('onclick="addInternalChordFromSelect()"', 'onclick="addInternalChordFromSelect()" data-i18n="btnAddChord"');
body = body.replace('<div style="font-size:0.75rem; color:var(--text-sub); margin-bottom:6px; font-weight:700;">الأضلاع الداخلية الحالية بالشكل:</div>', '<div style="font-size:0.75rem; color:var(--text-sub); margin-bottom:6px; font-weight:700;" data-i18n="chordsCurrentList">الأضلاع الداخلية الحالية بالشكل:</div>');

body = body.replace('<option value="blueprint">مخطط أزرق (Blueprint)</option>', '<option value="blueprint" data-i18n="styleBlueprint">مخطط أزرق (Blueprint)</option>');
body = body.replace('<option value="cad_dark">داكن هندسي (CAD Dark)</option>', '<option value="cad_dark" data-i18n="styleCadDark">داكن هندسي (CAD Dark)</option>');
body = body.replace('<option value="textbook">أبيض رسمي (Survey Classic)</option>', '<option value="textbook" data-i18n="styleClassic">أبيض رسمي (Survey Classic)</option>');
body = body.replace('<option value="a4_land">A4 أفقي (Landscape)</option>', '<option value="a4_land" data-i18n="pageA4Land">A4 أفقي (Landscape)</option>');
body = body.replace('<option value="a4_port">A4 رأسي (Portrait)</option>', '<option value="a4_port" data-i18n="pageA4Port">A4 رأسي (Portrait)</option>');
body = body.replace('<option value="square">مربع (1:1 Square)</option>', '<option value="square" data-i18n="pageSquare">مربع (1:1 Square)</option>');
body = body.replace('<option value="hd">عريض Full HD (1920×1080)</option>', '<option value="hd" data-i18n="pageHD">عريض Full HD (1920×1080)</option>');
body = body.replace('<option value="auto">تلقائي (Auto Fit)</option>', '<option value="auto" data-i18n="scaleAuto">تلقائي (Auto Fit)</option>');

// Trailing HTML: Toast and Angle modal
trailingHtml = trailingHtml.replace('<span id="appToastMsg">تم الحفظ بنجاح</span>', '<span id="appToastMsg" data-i18n="toastSavedDefault">تم الحفظ بنجاح</span>');
trailingHtml = trailingHtml.replace('<div style="font-size:0.96rem; font-weight:800; color:#ffffff;">تعديل زاوية الركن هندسياً</div>', '<div style="font-size:0.96rem; font-weight:800; color:#ffffff;" data-i18n="angleModalTitle">تعديل زاوية الركن هندسياً</div>');
trailingHtml = trailingHtml.replace('<div style="font-size:0.72rem; color:var(--text-sub); margin-bottom:12px;">', '<div style="font-size:0.72rem; color:var(--text-sub); margin-bottom:12px;" data-i18n="angleModalDesc">');
trailingHtml = trailingHtml.replace('<div style="font-size:0.72rem; color:var(--text-sub); margin-bottom:6px;">الركن المستهدف للتعديل:</div>', '<div style="font-size:0.72rem; color:var(--text-sub); margin-bottom:6px;" data-i18n="targetCorner">الركن المستهدف للتعديل:</div>');
trailingHtml = trailingHtml.replace('<div style="font-size:0.7rem; color:var(--text-sub);">الزاوية المقاسة الحالية:</div>', '<div style="font-size:0.7rem; color:var(--text-sub);" data-i18n="currentMeasuredAngle">الزاوية المقاسة الحالية:</div>');
trailingHtml = trailingHtml.replace('id="cornerTypeBadge"', 'id="cornerTypeBadge" data-i18n="angleTypeRight"');
trailingHtml = trailingHtml.replace('<label style="font-size:0.76rem; color:var(--text-main); font-weight:800;">الزاوية الجديدة المستهدفة بالدرجات (°):</label>', '<label style="font-size:0.76rem; color:var(--text-main); font-weight:800;" data-i18n="targetAngleDeg">الزاوية الجديدة المستهدفة بالدرجات (°):</label>');
trailingHtml = trailingHtml.replace('<div style="font-size:0.7rem; color:var(--text-sub); margin-bottom:6px;">زوايا قياسية سريعة:</div>', '<div style="font-size:0.7rem; color:var(--text-sub); margin-bottom:6px;" data-i18n="quickPresetAngles">زوايا قياسية سريعة:</div>');
trailingHtml = trailingHtml.replace('<button class="corner-preset-btn" onclick="setPresetAngle(90)">90° (قائمة ⦜)</button>', '<button class="corner-preset-btn" onclick="setPresetAngle(90)" data-i18n="presetRightAngle">90° (قائمة ⦜)</button>');
trailingHtml = trailingHtml.replace('<span>تطبيق وتعديل الزاوية</span>', '<span data-i18n="btnApplyAngleFull">تطبيق وتعديل الزاوية</span>');
trailingHtml = trailingHtml.replace('onclick="closeCornerAngleModal()" style="height:44px; font-size:0.86rem;">\n                    إلغاء\n                </button>', 'onclick="closeCornerAngleModal()" style="height:44px; font-size:0.86rem;" data-i18n="cancel">\n                    إلغاء\n                </button>');

// 2.3 Additional missing title tags
body = body.replaceAll(
    'class="menu-trigger-btn" onclick="openSideDrawer()" title="القائمة الرئيسية"',
    'class="menu-trigger-btn" onclick="openSideDrawer()" title="القائمة الرئيسية" data-i18n-title="mainMenu"'
);
body = body.replace(
    'class="zoom-btn" onclick="fitPlaygroundView()" title="توسيط وملاءمة"',
    'class="zoom-btn" onclick="fitPlaygroundView()" title="توسيط وملاءمة" data-i18n-title="titleFitView"'
);

console.log('=== 3. FIXING JAVASCRIPT LOGIC & BUGS ===');

// Step 3.1: Replace TRANSLATIONS with 293-key full bilingual dictionary
const i18nJs = fs.readFileSync('js/i18n.js', 'utf8');
const transStartNew = i18nJs.indexOf('const TRANSLATIONS = {');
const transEndNew = i18nJs.indexOf('function t(key', transStartNew);
const fullTranslations = i18nJs.substring(transStartNew, transEndNew).trim();

const transPos = script.indexOf('const TRANSLATIONS = {');
const transNext = script.indexOf('function changeAppLanguage', transPos);
if (transPos !== -1 && transNext !== -1) {
    script = script.substring(0, transPos) + fullTranslations + '\n\n        ' + script.substring(transNext);
    console.log('[OK] 293-key TRANSLATIONS embedded');
}

// Step 3.2: Delete duplicate broken displayResultsSheet at the end of file
const d1 = script.indexOf('function displayResultsSheet');
const d2 = script.indexOf('function displayResultsSheet', d1 + 30);
if (d2 !== -1) {
    const d2Next = script.indexOf('function decomposeFeddan', d2);
    if (d2Next !== -1) {
        script = script.substring(0, d2) + script.substring(d2Next);
        console.log('[OK] Duplicate displayResultsSheet removed');
    }
}

// Step 3.3: Replace displayResultsSheet with safe, non-crashing implementation
const fixedDisplayResultsSheet = `function displayResultsSheet(areaM2, perimeterM) {
    const decomp = decomposeFeddan(areaM2);
    const isEn = (AppSettings.lang === 'en');

    const elF = document.getElementById('resFeddan');
    if (elF) elF.textContent = decomp.feddans;
    const elQ = document.getElementById('resQirat');
    if (elQ) elQ.textContent = decomp.qirats;
    const elS = document.getElementById('resSahm');
    if (elS) elS.textContent = decomp.sahms;

    let summary = '';
    if (decomp.feddans > 0) summary += \`\${decomp.feddans} \${isEn ? 'Feddan ' : 'فدان '}\`;
    if (decomp.qirats > 0) summary += \`\${summary ? (isEn ? '+ ' : 'و ') : ''}\${decomp.qirats} \${isEn ? 'Qirat ' : 'قيراط '}\`;
    if (decomp.sahms > 0 || (decomp.feddans === 0 && decomp.qirats === 0)) summary += \`\${summary ? (isEn ? '+ ' : 'و ') : ''}\${decomp.sahms} \${isEn ? 'Sahm' : 'سهم'}\`;
    const elSum = document.getElementById('resFeddanText');
    if (elSum) elSum.textContent = summary;

    const dec = AppSettings.decimals ?? 2;
    const roundedArea = dec === 0 ? Math.round(areaM2) : areaM2.toFixed(dec);

    const elHero = document.getElementById('heroSqmVal');
    if (elHero) elHero.textContent = formatNum(roundedArea, dec);

    const elResSqm = document.getElementById('resSqm');
    if (elResSqm) elResSqm.textContent = formatNum(roundedArea, dec);

    const elQasaba = document.getElementById('resQasabaSq');
    if (elQasaba) elQasaba.textContent = formatNum((areaM2 / QASABA_SQUARE).toFixed(dec), dec);
    const elTotalQ = document.getElementById('resTotalQirat');
    if (elTotalQ) elTotalQ.textContent = formatNum((areaM2 / QIRAT_M2).toFixed(dec), dec);
    const elTotalS = document.getElementById('resTotalSahm');
    if (elTotalS) elTotalS.textContent = formatNum(Math.round(areaM2 / SAHM_M2));

    const perimMeters = dec === 0 ? Math.round(perimeterM) : perimeterM.toFixed(dec);
    const elPerimM = document.getElementById('resPerimeter');
    if (elPerimM) elPerimM.textContent = \`\${perimMeters} \${isEn ? 'm' : 'م'}\`;
    const elPerimQ = document.getElementById('resPerimeterQasaba');
    if (elPerimQ) elPerimQ.textContent = \`\${(perimeterM / QASABA_LINEAR).toFixed(dec)} \${isEn ? 'qasaba' : 'قصبة'}\`;

    const quickPill = document.getElementById('quickPill');
    if (quickPill) quickPill.textContent = \`\${formatNum(Math.round(areaM2))} \${isEn ? 'm²' : 'م²'}\`;
}`;

const dPos = script.indexOf('function displayResultsSheet');
const dNext = script.indexOf('async function checkAppUpdates', dPos);
if (dPos !== -1 && dNext !== -1) {
    script = script.substring(0, dPos) + fixedDisplayResultsSheet + '\n\n        ' + script.substring(dNext);
    console.log('[OK] displayResultsSheet replaced with safe implementation');
}

// Step 3.4: Replace saveSingleEdgeLength with guaranteed modal closing (try/finally)
const fixedSaveSingleEdge = `function saveSingleEdgeLength() {
    try {
        const input = document.getElementById('singleEdgeInput');
        const val = parseFloat(input?.value);
        if (isNaN(val) || val <= 0) return;

        const edge = Playground.editingEdgeIndex;
        const pts = Playground.points;

        if (typeof edge === 'string' && edge.startsWith('chord_')) {
            const cIdx = parseInt(edge.replace('chord_', ''), 10);
            const c = Playground.chords[cIdx];
            if (c && c.from < pts.length && c.to < pts.length) {
                const pA = pts[c.from];
                const pB = pts[c.to];
                const dx = pB.x - pA.x;
                const dy = pB.y - pA.y;
                const cur = Math.hypot(dx, dy);
                if (cur > 0) {
                    pB.x = Math.round(pA.x + (dx / cur) * val);
                    pB.y = Math.round(pA.y + (dy / cur) * val);
                }
            }
        } else if (typeof edge === 'number') {
            const nextIdx = (edge + 1) % pts.length;
            const pA = pts[edge];
            const pB = pts[nextIdx];
            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const cur = Math.hypot(dx, dy);
            if (cur > 0) {
                pB.x = Math.round(pA.x + (dx / cur) * val);
                pB.y = Math.round(pA.y + (dy / cur) * val);
            }
        }

        renderPlayground();
        updateCalculationsAndUI();
    } catch (err) {
        console.error('Error saving edge length:', err);
    } finally {
        closeSingleEdgeDialog();
    }
}`;

const edgePos = script.indexOf('function saveSingleEdgeLength');
const edgeNext = script.indexOf('function openChordsManagerModal', edgePos);
if (edgePos !== -1 && edgeNext !== -1) {
    script = script.substring(0, edgePos) + fixedSaveSingleEdge + '\n\n        ' + script.substring(edgeNext);
    console.log('[OK] saveSingleEdgeLength replaced with guaranteed modal closing');
}

// Step 3.5: Remove duplicate getExportConfig and updateExportOptionsLive
const exp1 = script.indexOf('function getExportConfig()');
const exp2 = script.indexOf('function getExportConfig()', exp1 + 30);
if (exp1 !== -1 && exp2 !== -1) {
    script = script.substring(0, exp1) + script.substring(exp2);
    console.log('[OK] Duplicate getExportConfig and updateExportOptionsLive removed');
}

// Step 3.6: Update openResultsBottomSheet with safe override support
script = script.replace(
    /function openResultsBottomSheet\(\)\s*\{\s*document\.getElementById\('bottomSheet'\)\.classList\.add\('open'\);\s*\}/,
    `function openResultsBottomSheet(areaOverride, perimOverride) {
    if (typeof areaOverride === 'number' && typeof perimOverride === 'number') {
        displayResultsSheet(areaOverride, perimOverride);
    } else {
        updateCalculationsAndUI();
    }
    document.getElementById('bottomSheet').classList.add('open');
}`
);
script = script.replace(
    'displayResultsSheet(areaM2, perimeterM);\n\n            openResultsBottomSheet();',
    'displayResultsSheet(areaM2, perimeterM);\n\n            openResultsBottomSheet(areaM2, perimeterM);'
);
console.log('[OK] openResultsBottomSheet updated with safe override support');

// Step 3.6b: Replace checkAppUpdates with openExternalUrl and direct download button
const newCheckUpdatesCode = fs.readFileSync('js/updates_engine.js', 'utf8').trim();
const chkPos = script.indexOf('async function checkAppUpdates()');
const chkEnd = script.indexOf('function initAppSettings()', chkPos);
if (chkPos !== -1 && chkEnd !== -1) {
    script = script.substring(0, chkPos) + newCheckUpdatesCode + '\n\n        ' + script.substring(chkEnd);
    console.log('[OK] checkAppUpdates and openExternalUrl attached from js/updates_engine.js');
}

// Step 3.7: Replace downloadClassicPDF with robust version supporting AndroidBridge + Blob
const fixedDownloadPdf = `function downloadClassicPDF() {
    try {
        const cfg = getExportConfig();
        let w = 1754;
        let h = 1240;
        let pdfPageW = 842; // A4 Landscape points
        let pdfPageH = 595;

        if (cfg.pageSize === 'a4_port') {
            w = 1240;
            h = 1754;
            pdfPageW = 595;
            pdfPageH = 842;
        } else if (cfg.pageSize === 'square') {
            w = 1400;
            h = 1400;
            pdfPageW = 600;
            pdfPageH = 600;
        }

        const canvas = renderClassicBlueprintCanvas(w, h);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const base64Data = jpegDataUrl.split(',')[1];
        const binaryStr = atob(base64Data);
        const imgBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            imgBytes[i] = binaryStr.charCodeAt(i);
        }

        const pdfBytes = generateSinglePagePdfWithJpeg(imgBytes, w, h, pdfPageW, pdfPageH);
        const isEn = (AppSettings.lang === 'en');
        const filename = isEn ? \`Misaha_Blueprint_\${Date.now()}.pdf\` : \`مخطط_كروكي_مساحة_\${Date.now()}.pdf\`;

        // Check if running inside Android WebView with Native Bridge
        if (typeof window.AndroidBridge !== 'undefined' && window.AndroidBridge.saveBase64File) {
            let binary = '';
            for (let i = 0; i < pdfBytes.length; i++) {
                binary += String.fromCharCode(pdfBytes[i]);
            }
            const b64Pdf = btoa(binary);
            window.AndroidBridge.saveBase64File(b64Pdf, filename, 'application/pdf');
            showToast(isEn ? 'PDF blueprint saved successfully' : 'تم تصدير وحفظ ملف PDF المعتمد بنجاح', 'success');
            return;
        }

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        showToast(isEn ? 'PDF blueprint saved successfully' : 'تم تصدير وحفظ ملف PDF المعتمد بنجاح', 'success');
    } catch (err) {
        console.error(err);
        showToast(AppSettings.lang === 'en' ? 'Error generating PDF file' : 'حدث خطأ أثناء توليد ملف PDF', 'error');
    }
}`;

const pdfPos = script.indexOf('function downloadClassicPDF');
const pdfEnd = script.indexOf('function updateCalculationsAndUI', pdfPos);
if (pdfPos !== -1 && pdfEnd !== -1) {
    script = script.substring(0, pdfPos) + fixedDownloadPdf + '\n\n        ' + script.substring(pdfEnd);
    console.log('[OK] downloadClassicPDF replaced with bilingual & AndroidBridge version');
}

// Step 3.8: Conversions display explicit '+' signs
script = script.replace(
    /\$\{f\}\s*فدان\s*و\s*\$\{q\}\s*قيراط\s*و\s*\$\{s\}\s*سهم/g,
    '${f} فدان + ${q} قيراط + ${s} سهم'
);
script = script.replace(
    /\$\{decomp\.feddans\}\s*فدان\s*و\s*\$\{decomp\.qirats\}\s*قيراط\s*و\s*\$\{decomp\.sahms\}\s*سهم/g,
    '${decomp.feddans} فدان + ${decomp.qirats} قيراط + ${decomp.sahms} سهم'
);
script = script.replace(
    /\$\{decomp\.feddans\}\s*Feddan,\s*\$\{decomp\.qirats\}\s*Qirat,\s*\$\{decomp\.sahms\}\s*Sahm/g,
    '${decomp.feddans} Feddan + ${decomp.qirats} Qirat + ${decomp.sahms} Sahm'
);

// Step 3.9: Bilingual Alphabets & Corner Naming
const bilingualCornersCode = `// Bilingual Alphabets for Corner/Vertex Labeling
        const CORNER_LETTERS_AR = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
        const CORNER_LETTERS_EN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

        function getCornerName(idx) {
            const letters = (AppSettings.lang === 'en') ? CORNER_LETTERS_EN : CORNER_LETTERS_AR;
            if (idx < letters.length) return letters[idx];
            const base = letters[idx % letters.length];
            const round = Math.floor(idx / letters.length) + 1;
            return \`\${base}\${round}\`;
        }

        function getEdgeName(idxA, idxB) {
            const isEn = (AppSettings.lang === 'en');
            return isEn ? \`Side \${getCornerName(idxA)}-\${getCornerName(idxB)}\` : \`الضلع \${getCornerName(idxA)}-\${getCornerName(idxB)}\`;
        }

        function getChordName(idxA, idxB) {
            const isEn = (AppSettings.lang === 'en');
            return isEn ? \`Chord \${getCornerName(idxA)}-\${getCornerName(idxB)}\` : \`الوتر \${getCornerName(idxA)}-\${getCornerName(idxB)}\`;
        }`;

const cornerStart = script.indexOf('const CORNER_LETTERS =');
const cornerNext = script.indexOf('// ========================================================', cornerStart);
if (cornerStart !== -1 && cornerNext !== -1) {
    script = script.substring(0, cornerStart) + bilingualCornersCode + '\n\n        ' + script.substring(cornerNext);
    console.log('[OK] Bilingual corner naming attached');
}

// Step 3.10: Bilingual Shape Names
const bilingualShapeNamesCode = `const SHAPE_NAMES = {
            quad_diag: 'رباعي غير منتظم بالوتر',
            quad_avg: 'رباعي بطريقة المتوسطات',
            trapezoid: 'شبه منحرف قياسي',
            trapezoid_right: 'شبه منحرف قائم الزاوية',
            rect: 'مستطيل / مربع',
            triangle: 'مثلث (3 أضلاع)',
            triangle_right: 'مثلث قائم الزاوية',
            parallelogram: 'متوازي أضلاع',
            rhombus: 'المَعين',
            l_shape: 'أرض زاوية (L)',
            t_shape: 'أرض شكل حرف T',
            pentagon_diag: 'خماسي غير منتظم بالوترين'
        };

        const SHAPE_NAMES_EN = {
            quad_diag: 'Irregular Quad by Diagonal',
            quad_avg: 'Quadrilateral by Averages',
            trapezoid: 'Standard Trapezoid',
            trapezoid_right: 'Right-Angled Trapezoid',
            rect: 'Rectangle / Square',
            triangle: 'Triangle (3 Sides)',
            triangle_right: 'Right-Angled Triangle',
            parallelogram: 'Parallelogram',
            rhombus: 'Rhombus',
            l_shape: 'L-Shaped Parcel',
            t_shape: 'T-Shaped Parcel',
            pentagon_diag: 'Irregular Pentagon with 2 Chords'
        };

        function getShapeName(type) {
            const isEn = (AppSettings.lang === 'en');
            return isEn ? (SHAPE_NAMES_EN[type] || SHAPE_NAMES[type]) : (SHAPE_NAMES[type] || SHAPE_NAMES_EN[type]);
        }`;

const shapeNamesPos = script.indexOf('const SHAPE_NAMES = {');
const shapeNamesNext = script.indexOf('function highlightFixedDiagramElement', shapeNamesPos);
if (shapeNamesPos !== -1 && shapeNamesNext !== -1) {
    script = script.substring(0, shapeNamesPos) + bilingualShapeNamesCode + '\n\n        ' + script.substring(shapeNamesNext);
    console.log('[OK] Bilingual shape names attached');
}

// Step 3.11: Update openFixedShapeDetail to use getShapeName
script = script.replace(
    'pill.textContent = SHAPE_NAMES[shapeType] || \'شكل هندسي\';',
    'pill.textContent = getShapeName(shapeType);'
);

// Step 3.12: Bilingual pickFixedShape
const pickStart = script.indexOf('function pickFixedShape(shapeType) {');
const pickEnd = script.indexOf('function renderFixedShapeDiagram', pickStart);
if (pickStart !== -1 && pickEnd !== -1) {
    const fixedPickFixedShape = `function pickFixedShape(shapeType) {
            selectedFixedShape = shapeType;
            const fields = document.getElementById('dynamicFormFields');
            const isEn = (AppSettings.lang === 'en');
            const uM = isEn ? 'm' : 'م';

            if (shapeType === 'quad_diag') {
                fields.innerHTML = \`
                    <div class="input-row-2x2">
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (A - B):' : 'الضلع (أ - ب):'}</label>
                            <div class="inp-wrap"><input type="number" id="fA" value="60" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (B - C):' : 'الضلع (ب - ج):'}</label>
                            <div class="inp-wrap"><input type="number" id="fB" value="45" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (C - D):' : 'الضلع (ج - د):'}</label>
                            <div class="inp-wrap"><input type="number" id="fC" value="58" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (D - A):' : 'الضلع (د - أ):'}</label>
                            <div class="inp-wrap"><input type="number" id="fD" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                    </div>
                    <div class="inp-box" style="margin-top:8px;">
                        <label>\${isEn ? 'Internal Diagonal (B - D):' : 'طول الوتر الداخلي (ب - د):'}</label>
                        <div class="inp-wrap"><input type="number" id="fDiag" value="75" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'quad_avg') {
                fields.innerHTML = \`
                    <div class="input-row-2x2">
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (A - B):' : 'الضلع (أ - ب):'}</label>
                            <div class="inp-wrap"><input type="number" id="fA" value="60" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (B - C):' : 'الضلع (ب - ج):'}</label>
                            <div class="inp-wrap"><input type="number" id="fB" value="45" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (C - D):' : 'الضلع (ج - د):'}</label>
                            <div class="inp-wrap"><input type="number" id="fC" value="58" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Side (D - A):' : 'الضلع (د - أ):'}</label>
                            <div class="inp-wrap"><input type="number" id="fD" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                    </div>
                    <div style="font-size:0.7rem; color:var(--text-sub); margin-top:4px;">\${isEn ? 'Calculation method: Average Length × Average Width.' : 'طريقة الحساب: متوسط الطولين × متوسط العرضين.'}</div>
                \`;
            } else if (shapeType === 'trapezoid') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'Upper Base - Side (A - B):' : 'القاعدة العلوية - الضلع (أ - ب):'}</label>
                        <div class="inp-wrap"><input type="number" id="fBaseMinor" value="50" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Lower Base - Side (D - C):' : 'القاعدة السفلية - الضلع (د - ج):'}</label>
                        <div class="inp-wrap"><input type="number" id="fBaseMajor" value="80" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Perpendicular Height (h):' : 'الارتفاع العمودي بين القاعدتين (ع):'}</label>
                        <div class="inp-wrap"><input type="number" id="fHeight" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'trapezoid_right') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'Minor Base - Side (A - B):' : 'القاعدة الصغرى - الضلع (أ - ب):'}</label>
                        <div class="inp-wrap"><input type="number" id="fTR_BaseMinor" value="45" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Major Base - Side (D - C):' : 'القاعدة الكبرى - الضلع (د - ج):'}</label>
                        <div class="inp-wrap"><input type="number" id="fTR_BaseMajor" value="75" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Perpendicular Side (Height) - Side (A - D):' : 'الجانب القائم (الارتفاع) - الضلع (أ - د):'}</label>
                        <div class="inp-wrap"><input type="number" id="fTR_Height" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'rect') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'Length - Side (A - B):' : 'الطول - الضلع (أ - ب):'}</label>
                        <div class="inp-wrap"><input type="number" id="fLength" value="60" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Width - Side (B - C):' : 'العرض - الضلع (ب - ج):'}</label>
                        <div class="inp-wrap"><input type="number" id="fWidth" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'triangle') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'First Side (A - B):' : 'الضلع الأول (أ - ب):'}</label>
                        <div class="inp-wrap"><input type="number" id="fTriA" value="50" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Second Side (B - C):' : 'الضلع الثاني (ب - ج):'}</label>
                        <div class="inp-wrap"><input type="number" id="fTriB" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Third Side (C - A):' : 'الضلع الثالث (ج - أ):'}</label>
                        <div class="inp-wrap"><input type="number" id="fTriC" value="45" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'triangle_right') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'Base Length - Side (A - B):' : 'طول القاعدة - الضلع (أ - ب):'}</label>
                        <div class="inp-wrap"><input type="number" id="fRT_Base" value="50" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Perpendicular Height - Side (A - C):' : 'الارتفاع القائم - الضلع (أ - ج):'}</label>
                        <div class="inp-wrap"><input type="number" id="fRT_Height" value="35" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'parallelogram') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'Base Length - Side (A - B):' : 'طول القاعدة - الضلع (أ - ب):'}</label>
                        <div class="inp-wrap"><input type="number" id="fPara_Base" value="65" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Slanted Side - Side (B - C):' : 'الضلع المائل - الضلع (ب - ج):'}</label>
                        <div class="inp-wrap"><input type="number" id="fPara_Side" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Perpendicular Height (h):' : 'الارتفاع العمودي الساقط (ع):'}</label>
                        <div class="inp-wrap"><input type="number" id="fPara_Height" value="35" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'rhombus') {
                fields.innerHTML = \`
                    <div class="inp-box">
                        <label>\${isEn ? 'First Diagonal (d1):' : 'طول القطر الأول (د1):'}</label>
                        <div class="inp-wrap"><input type="number" id="fRhomb_D1" value="70" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;">
                        <label>\${isEn ? 'Second Diagonal (d2):' : 'طول القطر الثاني (د2):'}</label>
                        <div class="inp-wrap"><input type="number" id="fRhomb_D2" value="45" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                    </div>
                \`;
            } else if (shapeType === 'l_shape') {
                fields.innerHTML = \`
                    <div style="font-size:0.75rem; color:var(--primary); font-weight:800; margin-bottom:4px;">\${isEn ? 'Part 1 (First Rectangle):' : 'القطعة 1 (المستطيل الأول):'}</div>
                    <div class="input-row-2x2">
                        <div class="inp-box">
                            <label>\${isEn ? 'Length 1:' : 'طول 1:'}</label>
                            <div class="inp-wrap"><input type="number" id="fL1" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Width 1:' : 'عرض 1:'}</label>
                            <div class="inp-wrap"><input type="number" id="fW1" value="25" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--amber); font-weight:800; margin:8px 0 4px 0;">\${isEn ? 'Part 2 (Attached Rectangle):' : 'القطعة 2 (المستطيل الملحق):'}</div>
                    <div class="input-row-2x2">
                        <div class="inp-box">
                            <label>\${isEn ? 'Length 2:' : 'طول 2:'}</label>
                            <div class="inp-wrap"><input type="number" id="fL2" value="30" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Width 2:' : 'عرض 2:'}</label>
                            <div class="inp-wrap"><input type="number" id="fW2" value="20" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                    </div>
                \`;
            } else if (shapeType === 't_shape') {
                fields.innerHTML = \`
                    <div style="font-size:0.75rem; color:var(--primary); font-weight:800; margin-bottom:4px;">\${isEn ? 'Horizontal Top Section:' : 'القطعة الأفقية (العلوية):'}</div>
                    <div class="input-row-2x2">
                        <div class="inp-box">
                            <label>\${isEn ? 'Top Length:' : 'طول علوي:'}</label>
                            <div class="inp-wrap"><input type="number" id="fT_TopL" value="50" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Top Width:' : 'عرض علوي:'}</label>
                            <div class="inp-wrap"><input type="number" id="fT_TopW" value="20" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--amber); font-weight:800; margin:8px 0 4px 0;">\${isEn ? 'Vertical Stem Section:' : 'الساق الرأسية:'}</div>
                    <div class="input-row-2x2">
                        <div class="inp-box">
                            <label>\${isEn ? 'Stem Length:' : 'طول الساق:'}</label>
                            <div class="inp-wrap"><input type="number" id="fT_StemL" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                        <div class="inp-box">
                            <label>\${isEn ? 'Stem Width:' : 'عرض الساق:'}</label>
                            <div class="inp-wrap"><input type="number" id="fT_StemW" value="20" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div>
                        </div>
                    </div>
                \`;
            } else if (shapeType === 'pentagon_diag') {
                fields.innerHTML = \`
                    <div style="font-size:0.74rem; color:var(--primary); font-weight:800; margin-bottom:4px;">\${isEn ? '5 Outer Pentagon Sides:' : 'أضلاع الخماسي الخارجية الخمسة:'}</div>
                    <div class="input-row-2x2">
                        <div class="inp-box"><label>\${isEn ? 'Side (A - B):' : 'الضلع (أ - ب):'}</label><div class="inp-wrap"><input type="number" id="fP_A" value="40" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>
                        <div class="inp-box"><label>\${isEn ? 'Side (B - C):' : 'الضلع (ب - ج):'}</label><div class="inp-wrap"><input type="number" id="fP_B" value="45" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>
                        <div class="inp-box"><label>\${isEn ? 'Side (C - D):' : 'الضلع (ج - د):'}</label><div class="inp-wrap"><input type="number" id="fP_C" value="50" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>
                        <div class="inp-box"><label>\${isEn ? 'Side (D - E):' : 'الضلع (د - هـ):'}</label><div class="inp-wrap"><input type="number" id="fP_D" value="42" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>
                    </div>
                    <div class="inp-box" style="margin-top:6px;"><label>\${isEn ? 'Side (E - A):' : 'الضلع (هـ - أ):'}</label><div class="inp-wrap"><input type="number" id="fP_E" value="38" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>

                    <div style="font-size:0.74rem; color:var(--amber); font-weight:800; margin:10px 0 4px 0;">\${isEn ? '2 Internal Chords (dividing into 3 triangles):' : 'الوتران الداخليان لتقسيم الخماسي لـ 3 مثلثات:'}</div>
                    <div class="input-row-2x2">
                        <div class="inp-box"><label>\${isEn ? 'First Chord (A - C):' : 'الوتر الأول (أ - ج):'}</label><div class="inp-wrap"><input type="number" id="fP_D1" value="65" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>
                        <div class="inp-box"><label>\${isEn ? 'Second Chord (A - D):' : 'الوتر الثاني (أ - د):'}</label><div class="inp-wrap"><input type="number" id="fP_D2" value="60" oninput="updateFixedDiagramLive()"><span class="unit">\${uM}</span></div></div>
                    </div>
                \`;
            }

            renderFixedShapeDiagram();
            updateFixedDiagramLive();
            initFixedDiagramHighlighter();
        }`;
    script = script.substring(0, pickStart) + fixedPickFixedShape + '\n\n        ' + script.substring(pickEnd);
    console.log('[OK] Bilingual pickFixedShape attached');
}

// Step 3.13: Localize renderPlayground badges and chords
const origChordLabel = 'const chordLabel = ' + String.fromCharCode(96) + 'الوتر ${getCornerName(c.from)}-${getCornerName(c.to)}' + String.fromCharCode(96) + ';';
script = script.replace(
    origChordLabel,
    'const chordLabel = getChordName(c.from, c.to);'
);
script = script.replace(
    '${edgeLabel}: ${distM}م </text>',
    '${edgeLabel}: ${distM}${AppSettings.lang === "en" ? "m" : "م"}</text>'
);
script = script.replace(
    '${chordLabel}: ${cLen}م </text>',
    '${chordLabel}: ${cLen}${AppSettings.lang === "en" ? "m" : "م"}</text>'
);
console.log('[OK] Step 3.13: renderPlayground badges and chords localized');

// Step 3.14: Localize openSingleEdgeModal titles
script = script.replace(
    'title.textContent = `تعديل طول الوتر الداخلي (${getCornerName(c.from)} - ${getCornerName(c.to)}):`;',
    'const isEn = (AppSettings.lang === "en"); title.textContent = isEn ? `Edit Internal Chord (${getCornerName(c.from)} - ${getCornerName(c.to)}):` : `تعديل طول الوتر الداخلي (${getCornerName(c.from)} - ${getCornerName(c.to)}):`;'
);
script = script.replace(
    'title.textContent = `تعديل طول الضلع (${getCornerName(edgeIndexOrDiag)} - ${getCornerName(nextIdx)}):`;',
    'const isEn = (AppSettings.lang === "en"); title.textContent = isEn ? `Edit Side Length (${getCornerName(edgeIndexOrDiag)} - ${getCornerName(nextIdx)}):` : `تعديل طول الضلع (${getCornerName(edgeIndexOrDiag)} - ${getCornerName(nextIdx)}):`;'
);
script = script.replace(
    "title.textContent = 'تعديل طول الوتر الداخلي:';",
    "title.textContent = (AppSettings.lang === 'en') ? 'Edit Internal Chord Length:' : 'تعديل طول الوتر الداخلي:';"
);

// Step 3.15: Localize renderActiveChordsList
const activeChordsCode = `function renderActiveChordsList() {
            const list = document.getElementById('activeChordsList');
            const pts = Playground.points;
            const isEn = (AppSettings.lang === 'en');
            if (!Playground.chords || Playground.chords.length === 0) {
                list.innerHTML = \`<div style="font-size:0.75rem; color:var(--text-sub); text-align:center; padding:8px;">\${isEn ? 'No internal chords currently added.' : 'لا توجد أوتار أو أضلاع داخلية حالياً.'}</div>\`;
                return;
            }

            let html = '';
            Playground.chords.forEach((c, idx) => {
                if (c.from < pts.length && c.to < pts.length) {
                    const dist = Math.round(Math.hypot(pts[c.to].x - pts[c.from].x, pts[c.to].y - pts[c.from].y));
                    html += \`
                        <div class="chord-item-row">
                            <div class="chord-item-title">
                                <span>\${isEn ? 'Chord ' : 'الوتر '}(\${getCornerName(c.from)} - \${getCornerName(c.to)}):</span>
                                <strong style="color:#fff;">\${dist} \${isEn ? 'm' : 'م'}</strong>
                            </div>
                            <div style="display:flex; align-items:center;">
                                <button class="btn-mini-edit" onclick="closeChordsManagerModal(); openSingleEdgeModal('chord_\${idx}', \${dist});">\${isEn ? 'Edit' : 'تعديل'}</button>
                                <button class="btn-mini-del" onclick="removeInternalChord(\${idx})">\${isEn ? 'Delete' : 'حذف'}</button>
                            </div>
                        </div>
                    \`;
                }
            });
            list.innerHTML = html;
        }`;

const actStart = script.indexOf('function renderActiveChordsList()');
const actEnd = script.indexOf('function addInternalChordFromSelect', actStart);
if (actStart !== -1 && actEnd !== -1) {
    script = script.substring(0, actStart) + activeChordsCode + '\n\n        ' + script.substring(actEnd);
    console.log('[OK] Bilingual renderActiveChordsList attached');
}

// Step 3.15b: Localize chords modal buttons and dropdown options
script = script.replace(
    "الوتر (أ - ج) ${hasAC ? '(محدد)' : ''}",
    "${(AppSettings.lang === 'en' ? 'Chord ' : 'الوتر ')} (${getCornerName(0)} - ${getCornerName(2)}) ${hasAC ? (AppSettings.lang === 'en' ? '(Selected)' : '(محدد)') : ''}"
);
script = script.replace(
    "الوتر (ب - د) ${hasBD ? '(محدد)' : ''}",
    "${(AppSettings.lang === 'en' ? 'Chord ' : 'الوتر ')} (${getCornerName(1)} - ${getCornerName(3)}) ${hasBD ? (AppSettings.lang === 'en' ? '(Selected)' : '(محدد)') : ''}"
);
script = script.replace(
    'opts += `<option value="${i}">ركن ${getCornerName(i)}</option>`;',
    'opts += `<option value="${i}">${(AppSettings.lang === "en" ? "Corner " : "ركن ")}${getCornerName(i)}</option>`;'
);
console.log('[OK] Step 3.15b: Chords modal quick switch & options localized');

// Step 3.16: Bilingual conversions (updateConvSummary, convertMultiArea, convertLength)
const bilingualConversionsCode = `function updateConvSummary(f, q, s, totalM2) {
            const sumEl = document.getElementById('convFqsSummary');
            const isEn = (AppSettings.lang === 'en');
            if (sumEl) {
                sumEl.textContent = isEn
                    ? \`\${f} Feddan + \${q} Qirat + \${s} Sahm = \${totalM2.toFixed(2)} m²\`
                    : \`\${f} فدان + \${q} قيراط + \${s} سهم = \${totalM2.toFixed(2)} م²\`;
            }
            const haEl = document.getElementById('convHectareVal');
            if (haEl) haEl.textContent = (totalM2 / 10000).toFixed(4);
            const donumEl = document.getElementById('convDonumVal');
            if (donumEl) donumEl.textContent = (totalM2 / 1000).toFixed(3);
            const acreEl = document.getElementById('convAcreVal');
            if (acreEl) acreEl.textContent = (totalM2 / 4046.8564).toFixed(3);
        }

        function convertMultiArea() {
            const val = parseFloat(document.getElementById('convMultiVal')?.value) || 0;
            const unit = document.getElementById('convMultiUnit')?.value || 'sqm';
            const rate = CONV_RATES[unit] || 1;
            const inSqm = val * rate;

            const grid = document.getElementById('multiAreaResultsGrid');
            if (!grid) return;

            const isEn = (AppSettings.lang === 'en');
            const items = isEn ? [
                { name: 'Square Meters (m²)', val: inSqm.toFixed(2), sub: 'm²' },
                { name: 'Square Qasaba', val: (inSqm / QASABA_SQUARE).toFixed(2), sub: '1 Qasaba² = 12.6025 m²' },
                { name: 'Egyptian Feddan', val: (inSqm / FEDDAN_M2).toFixed(4), sub: 'Decimal Feddan' },
                { name: 'Egyptian Qirat', val: (inSqm / QIRAT_M2).toFixed(2), sub: 'Net Qirat' },
                { name: 'Egyptian Sahm', val: (inSqm / SAHM_M2).toFixed(1), sub: 'Net Sahm' },
                { name: 'Hectare', val: (inSqm / 10000).toFixed(4), sub: '10,000 m²' },
                { name: 'Donum', val: (inSqm / 1000).toFixed(3), sub: '1,000 m²' },
                { name: 'Acre', val: (inSqm / 4046.8564).toFixed(3), sub: 'Western Acre' }
            ] : [
                { name: 'متر مربع (م²)', val: inSqm.toFixed(2), sub: 'م²' },
                { name: 'قصبة مربعة', val: (inSqm / QASABA_SQUARE).toFixed(2), sub: '1 قصبة² = 12.6025 م²' },
                { name: 'فدان مصري', val: (inSqm / FEDDAN_M2).toFixed(4), sub: 'فدان عشري' },
                { name: 'قيراط مصري', val: (inSqm / QIRAT_M2).toFixed(2), sub: 'قيراط صافي' },
                { name: 'سهم مصري', val: (inSqm / SAHM_M2).toFixed(1), sub: 'سهم صافي' },
                { name: 'هكتار (Hectare)', val: (inSqm / 10000).toFixed(4), sub: '10,000 م²' },
                { name: 'دونم (Donum)', val: (inSqm / 1000).toFixed(3), sub: '1,000 م²' },
                { name: 'إيكر (Acre)', val: (inSqm / 4046.8564).toFixed(3), sub: 'فدان غربي' }
            ];

            grid.innerHTML = items.map(it => \`
                <div class="unit-tile">
                    <div class="u-title">\${it.name}</div>
                    <div class="u-val">\${it.val}</div>
                    <div class="u-sub">\${it.sub}</div>
                </div>
            \`).join('');
        }

        function convertLength() {
            const val = parseFloat(document.getElementById('convLenVal')?.value) || 0;
            const unit = document.getElementById('convLenUnit')?.value || 'm';

            let inMeters = val;
            if (unit === 'qasaba') inMeters = val * 3.55;
            else if (unit === 'dhiraa_arch_len') inMeters = val * 0.75;
            else if (unit === 'dhiraa_baladi_len') inMeters = val * 0.58;
            else if (unit === 'foot') inMeters = val * 0.3048;
            else if (unit === 'yard') inMeters = val * 0.9144;
            else if (unit === 'km') inMeters = val * 1000;

            const grid = document.getElementById('lengthResultsGrid');
            if (!grid) return;

            const isEn = (AppSettings.lang === 'en');
            const items = isEn ? [
                { name: 'Linear Meter (m)', val: inMeters.toFixed(2), sub: 'Meters' },
                { name: 'Linear Qasaba', val: (inMeters / 3.55).toFixed(2), sub: '3.55 m' },
                { name: 'Architectural Dhiraa', val: (inMeters / 0.75).toFixed(2), sub: '75 cm' },
                { name: 'Baladi Dhiraa', val: (inMeters / 0.58).toFixed(2), sub: '58 cm' },
                { name: 'Foot (ft)', val: (inMeters / 0.3048).toFixed(2), sub: '0.3048 m' },
                { name: 'Yard (yd)', val: (inMeters / 0.9144).toFixed(2), sub: '3 feet' },
                { name: 'Kilometer (km)', val: (inMeters / 1000).toFixed(4), sub: '1,000 m' }
            ] : [
                { name: 'متر طولي (م)', val: inMeters.toFixed(2), sub: 'متر' },
                { name: 'قصبة طولية', val: (inMeters / 3.55).toFixed(2), sub: '3.55 م' },
                { name: 'ذراع معماري', val: (inMeters / 0.75).toFixed(2), sub: '75 سم' },
                { name: 'ذراع بلدي', val: (inMeters / 0.58).toFixed(2), sub: '58 سم' },
                { name: 'قدم (Foot)', val: (inMeters / 0.3048).toFixed(2), sub: '0.3048 م' },
                { name: 'ياردة (Yard)', val: (inMeters / 0.9144).toFixed(2), sub: '3 أقدام' },
                { name: 'كيلومتر (كم)', val: (inMeters / 1000).toFixed(4), sub: '1,000 م' }
            ];

            grid.innerHTML = items.map(it => \`
                <div class="unit-tile">
                    <div class="u-title">\${it.name}</div>
                    <div class="u-val">\${it.val}</div>
                    <div class="u-sub">\${it.sub}</div>
                </div>
            \`).join('');
        }`;

const convStart = script.indexOf('function updateConvSummary(f, q, s, totalM2)');
if (convStart !== -1) {
    script = script.substring(0, convStart) + bilingualConversionsCode;
    console.log('[OK] Bilingual conversions attached');
}

// Step 3.17: Append offline PDF 1.4 binary engine
const pdfEngineJs = fs.readFileSync('js/pdf_engine.js', 'utf8');
const pdfGenStart = pdfEngineJs.indexOf('function generateSinglePagePdfWithJpeg(');
if (pdfGenStart !== -1) {
    const pdfFunc = pdfEngineJs.substring(pdfGenStart).trim();
    script = script + '\n\n// --- OFFLINE PDF 1.4 BINARY ENGINE ---\n' + pdfFunc + '\n';
    console.log('[OK] Offline PDF 1.4 binary engine attached');
}

// Step 3.18: Bilingual downloadClassicPNG
const fixedDownloadPng = `function downloadClassicPNG() {
            try {
                const cfg = getExportConfig();
                let w = 1920;
                let h = 1080;
                if (cfg.pageSize === 'a4_port') {
                    w = 1240;
                    h = 1754;
                } else if (cfg.pageSize === 'square') {
                    w = 1400;
                    h = 1400;
                }

                const canvas = renderClassicBlueprintCanvas(w, h);
                const dataUrl = canvas.toDataURL('image/png');
                const isEn = (AppSettings.lang === 'en');
                const filename = isEn ? \`Misaha_Blueprint_\${Date.now()}.png\` : \`مخطط_كروكي_مساحة_\${Date.now()}.png\`;

                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast(isEn ? 'Blueprint image saved successfully to downloads' : 'تم حفظ الصورة بنجاح في التنزيلات', 'success');
            } catch (err) {
                console.error(err);
                showToast(AppSettings.lang === 'en' ? 'Error saving blueprint image' : 'حدث خطأ أثناء حفظ الصورة', 'error');
            }
        }`;

const pngPos = script.indexOf('function downloadClassicPNG()');
const pngNext = script.indexOf('function downloadClassicPDF', pngPos);
if (pngPos !== -1 && pngNext !== -1) {
    script = script.substring(0, pngPos) + fixedDownloadPng + '\n\n        ' + script.substring(pngNext);
    console.log('[OK] Bilingual downloadClassicPNG attached');
}

// Step 3.19: Bilingual corner angle tabs & badge
script = script.replace(
    'htmlTabs += `<button class="corner-pill-btn ${isActive}" onclick="selectCornerAngleTab(${idx})">ركن ${cName}</button>`;',
    'const isEn = (AppSettings.lang === "en"); htmlTabs += `<button class="corner-pill-btn ${isActive}" onclick="selectCornerAngleTab(${idx})">${isEn ? "Corner " : "ركن "}${cName}</button>`;'
);
script = script.replace(
    /if \(badge\) \{\s*if \(Math\.abs\(curAngle - 90\) <= 1\.5\) \{\s*badge\.textContent = 'قائمة ⦜';\s*badge\.style\.color = '#38bdf8';\s*\} else if \(curAngle < 90\) \{\s*badge\.textContent = 'حادة';\s*badge\.style\.color = '#10b981';\s*\} else \{\s*badge\.textContent = 'منفرجة';\s*badge\.style\.color = '#f59e0b';\s*\}\s*\}/,
    `if (badge) {
        const isEn = (AppSettings.lang === 'en');
        if (Math.abs(curAngle - 90) <= 1.5) {
            badge.textContent = isEn ? 'Right ⦜' : 'قائمة ⦜';
            badge.style.color = '#38bdf8';
        } else if (curAngle < 90) {
            badge.textContent = isEn ? 'Acute' : 'حادة';
            badge.style.color = '#10b981';
        } else {
            badge.textContent = isEn ? 'Obtuse' : 'منفرجة';
            badge.style.color = '#f59e0b';
        }
    }`
);
script = script.replace(
    /showToast\(\`تم ضبط زاوية الركن \(\$\{cName\}\) إلى \$\{targetDeg\}° بنجاح\`, 'success'\);/,
    `const isEn = (AppSettings.lang === 'en');
            showToast(isEn ? \`Corner (\${cName}) angle adjusted to \${targetDeg}° successfully\` : \`تم ضبط زاوية الركن (\${cName}) إلى \${targetDeg}° بنجاح\`, 'success');`
);

// Step 3.20: Comprehensive changeAppLanguage implementation
const comprehensiveChangeAppLang = `function changeAppLanguage(lang) {
            AppSettings.lang = (lang === 'en' ? 'en' : 'ar');
            document.documentElement.lang = AppSettings.lang;
            document.documentElement.dir = (AppSettings.lang === 'en' ? 'ltr' : 'rtl');

            const dict = TRANSLATIONS[AppSettings.lang];
            if (dict) {
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (dict[key]) {
                        el.textContent = dict[key];
                    }
                });
                document.querySelectorAll('[data-i18n-title]').forEach(el => {
                    const key = el.getAttribute('data-i18n-title');
                    if (dict[key]) {
                        el.setAttribute('title', dict[key]);
                    }
                });
                document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                    const key = el.getAttribute('data-i18n-placeholder');
                    if (dict[key]) {
                        el.setAttribute('placeholder', dict[key]);
                    }
                });
            }

            const selLang = document.getElementById('setLanguage');
            if (selLang) selLang.value = AppSettings.lang;

            try {
                localStorage.setItem('misaha_lang', AppSettings.lang);
            } catch (_) {}

            updateMoveButtonUI();
            updatePlaygroundStatus();
            renderPlayground();
            updateCalculationsAndUI();
            convertFromFQS();
            convertMultiArea();
            convertLength();
            renderClassicBlueprintPreview();

            const activePill = document.getElementById('activeShapePill');
            if (activePill && typeof selectedFixedShape !== 'undefined') {
                activePill.textContent = getShapeName(selectedFixedShape);
            }
            if (typeof pickFixedShape === 'function' && typeof selectedFixedShape !== 'undefined') {
                const detView = document.getElementById('shapesDetailView');
                if (detView && !detView.classList.contains('hidden')) {
                    pickFixedShape(selectedFixedShape);
                }
            }
            if (typeof renderActiveChordsList === 'function') {
                renderActiveChordsList();
            }
        }`;

const langPos = script.indexOf('function changeAppLanguage');
const langNext = script.indexOf('function applyAndSaveSettings', langPos);
if (langPos !== -1 && langNext !== -1) {
    script = script.substring(0, langPos) + comprehensiveChangeAppLang + '\n\n        ' + script.substring(langNext);
    console.log('[OK] Comprehensive changeAppLanguage attached');
}

// Step 3.21: Localize interactive alerts, confirms, and status messages
script = script.replace(
    "alert('يرجى إدخال زاوية صالحة بين 1° و 179°.');",
    "alert(AppSettings.lang === 'en' ? 'Please enter a valid angle between 1° and 179°.' : 'يرجى إدخال زاوية صالحة بين 1° و 179°.');"
);
script = script.replace(
    "showToast(`تم ضبط زاوية الركن (${cName}) على ${targetDeg}° بنجاح`);",
    "showToast(AppSettings.lang === 'en' ? `Corner (${cName}) angle adjusted to ${targetDeg}° successfully` : `تم ضبط زاوية الركن (${cName}) على ${targetDeg}° بنجاح`);"
);
script = script.replace(
    "if (!confirm('هل تريد بالتأكيد استعادة كافة الإعدادات الافتراضية؟')) return;",
    "if (!confirm(AppSettings.lang === 'en' ? 'Are you sure you want to restore all default settings?' : 'هل تريد بالتأكيد استعادة كافة الإعدادات الافتراضية؟')) return;"
);
script = script.replace(
    "alert('تمت استعادة الإعدادات الافتراضية بنجاح.');",
    "alert(AppSettings.lang === 'en' ? 'Default settings restored successfully.' : 'تمت استعادة الإعدادات الافتراضية بنجاح.');"
);
script = script.replace(
    "if (statusText) statusText.textContent = 'وضع التحريك: اسحب الأركان لتعديل شكل الأرض';",
    "if (statusText) statusText.textContent = (AppSettings.lang === 'en') ? 'Move Mode: Drag corners to adjust parcel' : 'وضع التحريك: اسحب الأركان لتعديل شكل الأرض';"
);
script = script.replace(
    "if (statusText) statusText.textContent = 'وضع الإضافة: المس أي مكان بالشاشة لإضافة ركن جديد';",
    "if (statusText) statusText.textContent = (AppSettings.lang === 'en') ? 'Add Mode: Tap canvas to add a new corner' : 'وضع الإضافة: المس أي مكان بالشاشة لإضافة ركن جديد';"
);
script = script.replace(
    "if (statusText) statusText.textContent = 'وضع الحذف: المس الركن المراد حذفه من الأرض';",
    "if (statusText) statusText.textContent = (AppSettings.lang === 'en') ? 'Delete Mode: Tap a corner to remove it' : 'وضع الحذف: المس الركن المراد حذفه من الأرض';"
);
script = script.replace(
    "alert('لا يمكن أن يقل مضلع الأرض عن 3 أركان (مثلث).');",
    "alert(AppSettings.lang === 'en' ? 'A land parcel polygon cannot have fewer than 3 corners (triangle).' : 'لا يمكن أن يقل مضلع الأرض عن 3 أركان (مثلث).');"
);
script = script.replace(
    "alert('يرجى اختيار ركنين مختلفين لتوصيل الضلع الداخلي.');",
    "alert(AppSettings.lang === 'en' ? 'Please choose two different corners to connect an internal chord.' : 'يرجى اختيار ركنين مختلفين لتوصيل الضلع الداخلي.');"
);
script = script.replace(
    "alert('الركنان المختاران يشكلان ضلعاً خارجياً للأرض بالفعل، الضلع الداخلي يجب أن يكون بين ركنين متقابلين.');",
    "alert(AppSettings.lang === 'en' ? 'The selected corners already form an outer boundary side. Internal chords must connect opposing corners.' : 'الركنان المختاران يشكلان ضلعاً خارجياً للأرض بالفعل، الضلع الداخلي يجب أن يكون بين ركنين متقابلين.');"
);
script = script.replace(
    "alert('هذا الضلع الداخلي مضاف بالفعل بالشكل.');",
    "alert(AppSettings.lang === 'en' ? 'This internal chord already exists in the shape.' : 'هذا الضلع الداخلي مضاف بالفعل بالشكل.');"
);
console.log('[OK] Step 3.21: Interactive alerts, confirms, and playground status localized');

console.log('=== 4. ASSEMBLING FINAL COMPLETE INDEX.HTML ===');
const finalHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#090e1a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="description" content="مِسَاحَة (Misaha 1+) - تطبيق كاداسترالي معتمد لحساب وتخطيط المساحات وتقسيم الأراضي ورسم المخططات الهندسية أوفلاين">
    <title data-i18n="appName">مِسَاحَة</title>

    <!-- External Stylesheet Link -->
    <link rel="stylesheet" href="css/style.css">

    <!-- Embedded High-Performance Offline Stylesheet -->
    <style>
${css}
    </style>
</head>
${body}

${trailingHtml}

    <!-- Main Application JavaScript Engine -->
    <script>
${script}
    </script>
</body>
</html>`;

fs.writeFileSync('index.html', finalHtml, 'utf8');
console.log(`[SUCCESS] index.html successfully assembled (${(Buffer.byteLength(finalHtml) / 1024).toFixed(1)} KB)!`);
