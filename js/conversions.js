/* ==========================================================================
   MISAHA 1+ - UNIT CONVERSIONS & STANDARDS ENGINE
   Two-way conversion: Feddan, Qirat, Sahm, Sqm, Qasaba², Lengths & Standards
   ========================================================================== */

function convertFromFQS() {
    const f = parseFloat(document.getElementById('convFeddan')?.value) || 0;
    const q = parseFloat(document.getElementById('convQirat')?.value) || 0;
    const s = parseFloat(document.getElementById('convSahm')?.value) || 0;

    const totalSqm = (f * FEDDAN_M2) + (q * QIRAT_M2) + (s * SAHM_M2);
    const totalQasabaSq = totalSqm / QASABA_SQUARE;

    const elSqm = document.getElementById('convSqm');
    const elQasaba = document.getElementById('convQasabaSq');
    const dec = AppSettings.decimals ?? 2;

    if (elSqm) elSqm.value = totalSqm > 0 ? (dec === 0 ? Math.round(totalSqm) : totalSqm.toFixed(dec)) : '';
    if (elQasaba) elQasaba.value = totalQasabaSq > 0 ? (dec === 0 ? Math.round(totalQasabaSq) : totalQasabaSq.toFixed(dec)) : '';

    updateSecondaryUnits(totalSqm);
    updateFqsSummaryDisplay(f, q, s, totalSqm);
}

function convertFromSqm() {
    const sqmVal = parseFloat(document.getElementById('convSqm')?.value);
    if (isNaN(sqmVal) || sqmVal < 0) {
        clearConversionOutputs();
        return;
    }

    const decomp = decomposeFeddan(sqmVal);
    const elF = document.getElementById('convFeddan');
    const elQ = document.getElementById('convQirat');
    const elS = document.getElementById('convSahm');
    const elQasaba = document.getElementById('convQasabaSq');
    const dec = AppSettings.decimals ?? 2;

    if (elF) elF.value = decomp.feddans;
    if (elQ) elQ.value = decomp.qirats;
    if (elS) elS.value = decomp.sahms;
    if (elQasaba) elQasaba.value = (sqmVal / QASABA_SQUARE).toFixed(dec);

    updateSecondaryUnits(sqmVal);
    updateFqsSummaryDisplay(decomp.feddans, decomp.qirats, decomp.sahms, sqmVal);
}

function convertFromQasabaSq() {
    const qVal = parseFloat(document.getElementById('convQasabaSq')?.value);
    if (isNaN(qVal) || qVal < 0) {
        clearConversionOutputs();
        return;
    }

    const totalSqm = qVal * QASABA_SQUARE;
    const elSqm = document.getElementById('convSqm');
    const dec = AppSettings.decimals ?? 2;
    if (elSqm) elSqm.value = dec === 0 ? Math.round(totalSqm) : totalSqm.toFixed(dec);

    const decomp = decomposeFeddan(totalSqm);
    const elF = document.getElementById('convFeddan');
    const elQ = document.getElementById('convQirat');
    const elS = document.getElementById('convSahm');

    if (elF) elF.value = decomp.feddans;
    if (elQ) elQ.value = decomp.qirats;
    if (elS) elS.value = decomp.sahms;

    updateSecondaryUnits(totalSqm);
    updateFqsSummaryDisplay(decomp.feddans, decomp.qirats, decomp.sahms, totalSqm);
}

function updateSecondaryUnits(sqm) {
    const elHectare = document.getElementById('convHectareVal');
    const elDonum = document.getElementById('convDonumVal');
    const elAcre = document.getElementById('convAcreVal');

    if (elHectare) elHectare.textContent = (sqm / 10000).toFixed(3);
    if (elDonum) elDonum.textContent = (sqm / 1000).toFixed(2);
    if (elAcre) elAcre.textContent = (sqm / 4046.856).toFixed(2);
}

function updateFqsSummaryDisplay(f, q, s, sqm) {
    const elText = document.getElementById('convFqsSummaryText');
    if (!elText) return;

    const isEn = (AppSettings.lang === 'en');
    const fStr = `${f} ${isEn ? 'Feddan' : 'فدان'}`;
    const qStr = `${q} ${isEn ? 'Qirat' : 'قيراط'}`;
    const sStr = `${s} ${isEn ? 'Sahm' : 'سهم'}`;
    const sqmFormatted = formatNum(sqm);

    elText.textContent = `${fStr} + ${qStr} + ${sStr} = ${sqmFormatted} ${isEn ? 'm²' : 'م²'}`;
}

function clearConversionOutputs() {
    const ids = ['convFeddan', 'convQirat', 'convSahm', 'convSqm', 'convQasabaSq'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    updateSecondaryUnits(0);
    const elText = document.getElementById('convFqsSummaryText');
    if (elText) elText.textContent = '';
}

function resetFeddanConverter() {
    const elF = document.getElementById('convFeddan');
    const elQ = document.getElementById('convQirat');
    const elS = document.getElementById('convSahm');
    if (elF) elF.value = '1';
    if (elQ) elQ.value = '12';
    if (elS) elS.value = '0';
    convertFromFQS();
}

// Length & Distance Converter
function convertLengthDistance() {
    const val = parseFloat(document.getElementById('lenInputVal')?.value) || 0;
    const unit = document.getElementById('lenFromUnit')?.value || 'm';

    // Base: convert everything to linear meters first
    let meters = val;
    switch (unit) {
        case 'm': meters = val; break;
        case 'qasaba': meters = val * 3.55; break;
        case 'dhiraa_arch': meters = val * 0.75; break;
        case 'dhiraa_baladi': meters = val * 0.58; break;
        case 'foot': meters = val * 0.3048; break;
        case 'yard': meters = val * 0.9144; break;
        case 'km': meters = val * 1000; break;
    }

    const dec = 3;
    const setRes = (id, num) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatNum(num, dec);
    };

    setRes('resLenMeter', meters);
    setRes('resLenQasaba', meters / 3.55);
    setRes('resLenDhiraaArch', meters / 0.75);
    setRes('resLenDhiraaBaladi', meters / 0.58);
    setRes('resLenFoot', meters / 0.3048);
    setRes('resLenYard', meters / 0.9144);
    setRes('resLenKm', meters / 1000);
}
