/* ==========================================================================
   MISAHA 1+ - APPLICATION CONTROLLER & INTERACTION SYSTEM
   Lifecycle, Touch & Pointer handling, Modals, Drawer, Settings & Toasts
   ========================================================================== */

let currentView = 'playground';
let activeEdgeEditTarget = null;
let activeAngleEditIndex = null;

// Multi-touch pinch zoom state
let activeTouchDist = null;

document.addEventListener('DOMContentLoaded', () => {
    initSettingsFromStorage();
    initPlaygroundEvents();
    renderPlayground();
    updateCalculationsAndUI();
    fitPlaygroundView();

    // Auto-select text on input focus if enabled
    document.addEventListener('focusin', (e) => {
        if (AppSettings.autoSelectInput && e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
            setTimeout(() => e.target.select(), 50);
        }
    });

    // Handle back button on mobile web / Android
    window.addEventListener('popstate', (e) => {
        if (closeOpenModals()) {
            e.preventDefault();
        }
    });
});

// Initialize Settings from LocalStorage
function initSettingsFromStorage() {
    try {
        const savedLang = localStorage.getItem('misaha_lang');
        if (savedLang) AppSettings.lang = savedLang;

        const savedUnit = localStorage.getItem('misaha_primary_unit');
        if (savedUnit) AppSettings.primaryUnit = savedUnit;

        const savedDec = localStorage.getItem('misaha_decimals');
        if (savedDec !== null) AppSettings.decimals = parseInt(savedDec, 10);

        const savedCorners = localStorage.getItem('misaha_show_corners');
        if (savedCorners !== null) AppSettings.showCorners = (savedCorners === 'true');

        const savedAuto = localStorage.getItem('misaha_auto_select');
        if (savedAuto !== null) AppSettings.autoSelectInput = (savedAuto === 'true');
    } catch (_) {}

    changeAppLanguage(AppSettings.lang);

    // Sync UI elements
    const sDec = document.getElementById('setDecimalPlaces');
    if (sDec) sDec.value = String(AppSettings.decimals);
    const sCorners = document.getElementById('setCornersVisible');
    if (sCorners) sCorners.checked = AppSettings.showCorners;
    const sAuto = document.getElementById('setAutoSelectInput');
    if (sAuto) sAuto.checked = AppSettings.autoSelectInput;
}

// Navigation between views
function switchView(viewId) {
    closeSideDrawer();
    closeResultsSheet();

    document.querySelectorAll('.view-page').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.drawer-item').forEach(item => item.classList.remove('active'));

    const targetView = document.getElementById(`view${capitalize(viewId)}`);
    if (targetView) targetView.classList.add('active');

    const drawerItem = document.getElementById(`navItem_${viewId}`);
    if (drawerItem) drawerItem.classList.add('active');

    currentView = viewId;

    if (viewId === 'playground') {
        setTimeout(() => fitPlaygroundView(), 60);
    } else if (viewId === 'fixedShapes') {
        renderFixedShapeDiagram();
        updateFixedDiagramLive();
    } else if (viewId === 'conversions') {
        convertFromFQS();
        convertLengthDistance();
    }
}

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Side Drawer Controls
function openSideDrawer() {
    const overlay = document.getElementById('drawerOverlay');
    if (overlay) overlay.classList.add('active');
}

function closeSideDrawer() {
    const overlay = document.getElementById('drawerOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Close any open modal on escape key or back
function closeOpenModals() {
    let closed = false;
    const overlays = [
        'exportModal', 'singleEdgeModal', 'chordsModal', 'cornerAngleModal',
        'resultsSheetOverlay', 'drawerOverlay'
    ];
    overlays.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('active')) {
            el.classList.remove('active');
            closed = true;
        }
    });
    return closed;
}

// Results Bottom Sheet Display
function displayResultsSheet(areaM2, perimeterM) {
    const decomp = decomposeFeddan(areaM2);
    const isEn = (AppSettings.lang === 'en');
    const uM = isEn ? 'm' : 'م';

    // 1. Feddan, Qirat, Sahm cards
    const setSafeText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setSafeText('resFeddan', decomp.feddans);
    setSafeText('resQirat', decomp.qirats);
    setSafeText('resSahm', decomp.sahms);

    // Summary breakdown text
    let summary = '';
    if (decomp.feddans > 0) summary += `${decomp.feddans} ${isEn ? 'Feddan' : 'فدان'}`;
    if (decomp.qirats > 0) summary += `${summary ? (isEn ? ' + ' : ' و ') : ''}${decomp.qirats} ${isEn ? 'Qirat' : 'قيراط'}`;
    if (decomp.sahms > 0 || (decomp.feddans === 0 && decomp.qirats === 0)) {
        summary += `${summary ? (isEn ? ' + ' : ' و ') : ''}${decomp.sahms} ${isEn ? 'Sahm' : 'سهم'}`;
    }
    setSafeText('resFeddanText', summary);

    // Sqm & Secondary Units
    const dec = AppSettings.decimals ?? 2;
    const roundedArea = dec === 0 ? Math.round(areaM2) : areaM2.toFixed(dec);
    setSafeText('resSqm', formatNum(roundedArea, dec));
    setSafeText('heroSqmVal', formatNum(roundedArea, dec));
    setSafeText('resQasabaSq', formatNum(areaM2 / QASABA_SQUARE, dec));
    setSafeText('resTotalQirat', formatNum(areaM2 / QIRAT_M2, dec));
    setSafeText('resTotalSahm', formatNum(Math.round(areaM2 / SAHM_M2)));

    // Perimeter
    const perimFormatted = formatNum(perimeterM, dec === 0 ? 0 : 1);
    setSafeText('resPerimeter', `${perimFormatted} ${uM}`);
    setSafeText('resPerimeterQasaba', `${formatNum(perimeterM / QASABA_LINEAR, dec)} ${isEn ? 'qasaba' : 'قصبة'}`);

    // Quick pill in bottom bar
    const quickPill = document.getElementById('quickPill');
    if (quickPill) {
        if (AppSettings.primaryUnit === 'sqm') {
            quickPill.textContent = `${formatNum(roundedArea, dec)} ${isEn ? 'm²' : 'م²'}`;
        } else {
            quickPill.textContent = `${decomp.feddans}ف ${decomp.qirats}ط ${decomp.sahms}س`;
        }
    }

    // Open Bottom Sheet
    const sheetOverlay = document.getElementById('resultsSheetOverlay');
    if (sheetOverlay) sheetOverlay.classList.add('active');
}

function closeResultsSheet() {
    const sheetOverlay = document.getElementById('resultsSheetOverlay');
    if (sheetOverlay) sheetOverlay.classList.remove('active');
}

// Copy results to clipboard
function copyResultsToClipboard() {
    const pts = Playground.points;
    const areaM2 = calculateShoelace(pts);
    const perimeterM = calculatePerimeter(pts);
    const decomp = decomposeFeddan(areaM2);
    const isEn = (AppSettings.lang === 'en');

    const text = isEn
        ? `Misaha Cadastral Results:\nTotal Area: ${formatNum(areaM2)} m²\nBreakdown: ${decomp.feddans} Feddan, ${decomp.qirats} Qirat, ${decomp.sahms} Sahm\nPerimeter: ${formatNum(perimeterM, 1)} m`
        : `نتائج كروكي مساحة:\nالمساحة الإجمالية: ${formatNum(areaM2)} م²\nالتفصيل الزراعي: ${decomp.feddans} فدان و ${decomp.qirats} قيراط و ${decomp.sahms} سهم\nمحيط الأرض (طول السياج): ${formatNum(perimeterM, 1)} م`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(t('toastCopied'), 'success');
        }).catch(() => {
            promptFallback(text);
        });
    } else {
        promptFallback(text);
    }
}

function promptFallback(text) {
    prompt(isEn ? 'Copy results:' : 'انسخ النتائج أدناه:', text);
    showToast(t('toastCopied'), 'success');
}

// Update Calculations and Bottom Bar
function updateCalculationsAndUI() {
    const pts = Playground.points;
    if (pts.length < 3) return;

    const areaM2 = calculateShoelace(pts);
    const perimeterM = calculatePerimeter(pts);
    const decomp = decomposeFeddan(areaM2);
    const isEn = (AppSettings.lang === 'en');
    const dec = AppSettings.decimals ?? 2;

    const quickPill = document.getElementById('quickPill');
    if (quickPill) {
        if (AppSettings.primaryUnit === 'sqm') {
            quickPill.textContent = `${formatNum(areaM2, dec)} ${isEn ? 'm²' : 'م²'}`;
        } else {
            quickPill.textContent = `${decomp.feddans}ف ${decomp.qirats}ط ${decomp.sahms}س`;
        }
    }
}

// Render Playground Canvas
function renderPlayground() {
    const poly = document.getElementById('landPolygon');
    const edgesLayer = document.getElementById('edgesLayer');
    const verticesLayer = document.getElementById('verticesLayer');
    const pts = Playground.points;
    if (pts.length < 3) return;

    const isEn = (AppSettings.lang === 'en');
    const uM = isEn ? 'm' : 'م';
    const n = pts.length;

    // Convert points to screen coordinates
    const screenPts = pts.map(p => worldToScreen(p.x, p.y));

    // Polygon
    const polyStr = screenPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    if (poly) poly.setAttribute('points', polyStr);

    let edgesHtml = '';

    // 1. Chords & Internal Edges
    if (Playground.hasDiagonal && Playground.chords && Playground.chords.length > 0) {
        Playground.chords.forEach((c, cIdx) => {
            if (c.from < n && c.to < n && c.from !== c.to) {
                const s = screenPts[c.from];
                const e = screenPts[c.to];
                const cLen = Math.round(Math.hypot(pts[c.to].x - pts[c.from].x, pts[c.to].y - pts[c.from].y));
                const chordLabel = `${getChordName(c.from, c.to)}: ${cLen}${uM}`;
                const t = (Playground.chords.length > 1) ? (cIdx % 2 === 0 ? 0.42 : 0.58) : 0.5;
                const midX = s.x + (e.x - s.x) * t;
                const midY = s.y + (e.y - s.y) * t;
                const tw = chordLabel.length * 7 + 24;

                edgesHtml += `
                    <line x1="${s.x}" y1="${s.y}" x2="${e.x}" y2="${e.y}" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="6,4" pointer-events="none" />
                    <g style="cursor:pointer;" onclick="openSingleEdgeModal('chord_${cIdx}', ${cLen})">
                        <rect x="${midX - tw / 2}" y="${midY - 12}" width="${tw}" height="24" rx="12" fill="#090e17" stroke="#f59e0b" stroke-width="1.8" />
                        <text x="${midX}" y="${midY + 4}" fill="#fde047" font-size="10" font-weight="900" text-anchor="middle">${chordLabel}</text>
                    </g>
                `;
            }
        });
    }

    // 2. Outer Edges
    for (let i = 0; i < n; i++) {
        const nextIdx = (i + 1) % n;
        const pA = screenPts[i];
        const pB = screenPts[nextIdx];
        const midX = (pA.x + pB.x) / 2;
        const midY = (pA.y + pB.y) / 2;
        const distM = Math.round(Math.hypot(pts[nextIdx].x - pts[i].x, pts[nextIdx].y - pts[i].y));
        const edgeLabel = `${getEdgeName(i, nextIdx)}: ${distM}${uM}`;
        const tw = edgeLabel.length * 7 + 24;

        edgesHtml += `
            <g style="cursor:pointer;" onclick="openSingleEdgeModal(${i}, ${distM})">
                <rect x="${midX - tw / 2}" y="${midY - 12}" width="${tw}" height="24" rx="12" fill="#090e17" stroke="#1e293b" stroke-width="1.8" />
                <text x="${midX}" y="${midY + 4}" fill="#a7f3d0" font-size="10" font-weight="900" text-anchor="middle">${edgeLabel}</text>
            </g>
        `;
    }

    if (edgesLayer) edgesLayer.innerHTML = edgesHtml;

    // 3. Vertices (Corners)
    let verticesHtml = '';
    screenPts.forEach((p, idx) => {
        const cName = AppSettings.showCorners ? getCornerName(idx) : '';
        verticesHtml += `
            <g data-corner="${idx}" style="cursor:${Playground.moveEnabled ? 'grab' : 'pointer'};">
                <circle cx="${p.x}" cy="${p.y}" r="17" fill="rgba(16, 185, 129, 0.2)" />
                <circle cx="${p.x}" cy="${p.y}" r="11" fill="#ffffff" stroke="#10b981" stroke-width="3" />
                <text x="${p.x}" y="${p.y + 4}" font-size="11" font-weight="900" text-anchor="middle" fill="#064e3b" pointer-events="none">${cName}</text>
            </g>
        `;
    });

    if (verticesLayer) verticesLayer.innerHTML = verticesHtml;
}

// Pointer & Touch Events on Playground Canvas
function initPlaygroundEvents() {
    const svg = document.getElementById('landSvg');
    if (!svg) return;

    svg.addEventListener('pointerdown', onPlaygroundPointerDown);
    svg.addEventListener('pointermove', onPlaygroundPointerMove);
    svg.addEventListener('pointerup', onPlaygroundPointerUp);
    svg.addEventListener('pointercancel', onPlaygroundPointerUp);

    // Mouse wheel zoom
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        zoomPlayground(factor);
    }, { passive: false });

    // Touch pinch-to-zoom
    svg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            activeTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    });

    svg.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && activeTouchDist) {
            e.preventDefault();
            const newDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const ratio = newDist / activeTouchDist;
            if (Math.abs(ratio - 1) > 0.04) {
                zoomPlayground(ratio > 1 ? 1.05 : 0.95);
                activeTouchDist = newDist;
            }
        }
    }, { passive: false });

    svg.addEventListener('touchend', () => {
        activeTouchDist = null;
    });
}

function onPlaygroundPointerDown(e) {
    const svg = document.getElementById('landSvg');
    svg.setPointerCapture(e.pointerId);

    const rect = svg.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Corner interaction
    const targetCorner = e.target.closest('[data-corner]');
    if (targetCorner) {
        const cIdx = parseInt(targetCorner.getAttribute('data-corner'), 10);
        if (Playground.activeTool === 'del') {
            deleteCorner(cIdx);
            return;
        }
        if (Playground.moveEnabled) {
            Playground.dragCornerIndex = cIdx;
            return;
        } else {
            openCornerAngleModal(cIdx);
            return;
        }
    }

    // Add Corner Tool
    if (Playground.activeTool === 'add') {
        const world = screenToWorld(sx, sy);
        addCornerAt(Math.round(world.x), Math.round(world.y));
        return;
    }

    // Pan canvas
    Playground.isPanning = true;
    Playground.panStartX = sx;
    Playground.panStartY = sy;
    Playground.initialPanX = Playground.panX;
    Playground.initialPanY = Playground.panY;
}

let playgroundMoveRaf = null;

function onPlaygroundPointerMove(e) {
    const svg = document.getElementById('landSvg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (Playground.dragCornerIndex !== null) {
        const world = screenToWorld(sx, sy);
        Playground.points[Playground.dragCornerIndex].x = Math.round(world.x);
        Playground.points[Playground.dragCornerIndex].y = Math.round(world.y);

        if (!playgroundMoveRaf) {
            playgroundMoveRaf = requestAnimationFrame(() => {
                playgroundMoveRaf = null;
                renderPlayground();
                updateCalculationsAndUI();
            });
        }
        return;
    }

    if (Playground.isPanning) {
        const dx = (sx - Playground.panStartX) / Playground.zoom;
        const dy = (sy - Playground.panStartY) / Playground.zoom;
        Playground.panX = Playground.initialPanX + dx;
        Playground.panY = Playground.initialPanY + dy;

        if (!playgroundMoveRaf) {
            playgroundMoveRaf = requestAnimationFrame(() => {
                playgroundMoveRaf = null;
                renderPlayground();
            });
        }
    }
}

function onPlaygroundPointerUp(e) {
    try {
        const svg = document.getElementById('landSvg');
        if (svg) svg.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (playgroundMoveRaf) {
        cancelAnimationFrame(playgroundMoveRaf);
        playgroundMoveRaf = null;
        renderPlayground();
        updateCalculationsAndUI();
    }

    Playground.dragCornerIndex = null;
    Playground.isPanning = false;
}

// Add Corner at world coords
function addCornerAt(wx, wy) {
    const pts = Playground.points;
    const n = pts.length;
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < n; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dist = Math.hypot(wx - midX, wy - midY);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i + 1;
        }
    }

    pts.splice(bestIdx, 0, { x: wx, y: wy });
    selectPlaygroundTool('move');
    renderPlayground();
    updateCalculationsAndUI();
    showToast(t('toastCornerAdded'), 'success');
}

// Delete Corner
function deleteCorner(index) {
    const pts = Playground.points;
    if (pts.length <= 3) {
        showToast(t('toastMinCorners'), 'warning');
        return;
    }

    pts.splice(index, 1);

    // Update chords referencing this or shifted corners
    Playground.chords = Playground.chords
        .filter(c => c.from !== index && c.to !== index)
        .map(c => ({
            from: c.from > index ? c.from - 1 : c.from,
            to: c.to > index ? c.to - 1 : c.to
        }));

    selectPlaygroundTool('move');
    renderPlayground();
    updateCalculationsAndUI();
    showToast(t('toastCornerDeleted'), 'success');
}

// Playground Toolbar Controls
function togglePlaygroundMove() {
    Playground.moveEnabled = !Playground.moveEnabled;
    const btn = document.getElementById('toolMove');
    const txt = document.getElementById('toolMoveText');
    if (btn) btn.classList.toggle('active', Playground.moveEnabled);
    if (txt) txt.textContent = Playground.moveEnabled ? t('toolMove') : t('toolMoveOff');
    renderPlayground();
}

function selectPlaygroundTool(tool) {
    Playground.activeTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => {
        if (b.id === 'toolAdd' || b.id === 'toolDel') b.classList.remove('active');
    });

    if (tool === 'add') {
        document.getElementById('toolAdd')?.classList.add('active');
    } else if (tool === 'del') {
        document.getElementById('toolDel')?.classList.add('active');
    }
}

function togglePlaygroundGrid() {
    Playground.gridVisible = !Playground.gridVisible;
    const gridEl = document.getElementById('gridPattern');
    if (gridEl) gridEl.style.display = Playground.gridVisible ? 'block' : 'none';
    const btn = document.getElementById('toolGrid');
    if (btn) btn.classList.toggle('active', Playground.gridVisible);
}

function zoomPlayground(factor) {
    Playground.zoom = Math.max(0.3, Math.min(3.0, Playground.zoom * factor));
    renderPlayground();
}

function resetPlaygroundPreset() {
    Playground.points = [
        { x: 100, y: 100 },
        { x: 350, y: 120 },
        { x: 310, y: 320 },
        { x: 80,  y: 280 }
    ];
    Playground.chords = [{ from: 0, to: 2 }];
    Playground.hasDiagonal = true;
    fitPlaygroundView();
    renderPlayground();
    updateCalculationsAndUI();
}

function toggleSideToolbar() {
    const toolbar = document.getElementById('playgroundToolbar');
    const reopenBtn = document.getElementById('toolbarReopenBtn');
    if (!toolbar) return;

    toolbar.classList.toggle('collapsed');
    const isCollapsed = toolbar.classList.contains('collapsed');
    if (reopenBtn) reopenBtn.classList.toggle('visible', isCollapsed);
}

// Single Edge & Chord Modals
function openSingleEdgeModal(target, currentLen) {
    activeEdgeEditTarget = target;
    const modal = document.getElementById('singleEdgeModal');
    const titleEl = document.getElementById('singleEdgeTitle');
    const valInput = document.getElementById('singleEdgeVal');

    if (valInput) valInput.value = currentLen;

    if (typeof target === 'string' && target.startsWith('chord_')) {
        const cIdx = parseInt(target.replace('chord_', ''), 10);
        const c = Playground.chords[cIdx];
        if (c && titleEl) {
            titleEl.textContent = `${getChordName(c.from, c.to)}`;
        }
    } else {
        const i = parseInt(target, 10);
        const next = (i + 1) % Playground.points.length;
        if (titleEl) {
            titleEl.textContent = `${getEdgeName(i, next)}`;
        }
    }

    if (modal) modal.classList.add('active');
    setTimeout(() => valInput?.select(), 100);
}

function closeSingleEdgeDialog() {
    const modal = document.getElementById('singleEdgeModal');
    if (modal) modal.classList.remove('active');
    activeEdgeEditTarget = null;
}

function saveSingleEdgeLength() {
    const valInput = document.getElementById('singleEdgeVal');
    const newLen = parseFloat(valInput?.value);
    if (isNaN(newLen) || newLen <= 0) {
        showToast(t('toastInputError'), 'error');
        return;
    }

    const pts = Playground.points;
    const n = pts.length;

    if (typeof activeEdgeEditTarget === 'string' && activeEdgeEditTarget.startsWith('chord_')) {
        const cIdx = parseInt(activeEdgeEditTarget.replace('chord_', ''), 10);
        const c = Playground.chords[cIdx];
        if (c) {
            adjustEdgeLength(pts, c.from, c.to, newLen);
        }
    } else if (activeEdgeEditTarget !== null) {
        const i = parseInt(activeEdgeEditTarget, 10);
        const next = (i + 1) % n;
        adjustEdgeLength(pts, i, next, newLen);
    }

    closeSingleEdgeDialog();
    renderPlayground();
    updateCalculationsAndUI();
}

function adjustEdgeLength(pts, i, j, newLen) {
    const pA = pts[i];
    const pB = pts[j];
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const currentLen = Math.hypot(dx, dy);
    if (currentLen === 0) return;

    const ratio = newLen / currentLen;
    // Move pB along line from pA
    pB.x = Math.round(pA.x + dx * ratio);
    pB.y = Math.round(pA.y + dy * ratio);
}

// Chords & Internal Diagonals Manager
function openChordsManagerModal() {
    const modal = document.getElementById('chordsModal');
    if (modal) modal.classList.add('active');
    populateChordsList();
    populateChordsSelects();
}

function closeChordsManagerModal() {
    const modal = document.getElementById('chordsModal');
    if (modal) modal.classList.remove('active');
}

function togglePrimaryChord() {
    const pts = Playground.points;
    if (pts.length !== 4) return;

    if (!Playground.chords || Playground.chords.length === 0) {
        Playground.chords = [{ from: 0, to: 2 }];
        Playground.hasDiagonal = true;
    } else {
        const c = Playground.chords[0];
        if (c.from === 0 && c.to === 2) {
            Playground.chords[0] = { from: 1, to: 3 };
        } else {
            Playground.chords[0] = { from: 0, to: 2 };
        }
    }

    renderPlayground();
    updateCalculationsAndUI();
    populateChordsList();
}

function populateChordsSelects() {
    const selFrom = document.getElementById('chordFromCorner');
    const selTo = document.getElementById('chordToCorner');
    if (!selFrom || !selTo) return;

    selFrom.innerHTML = '';
    selTo.innerHTML = '';
    const pts = Playground.points;

    pts.forEach((_, idx) => {
        const optA = document.createElement('option');
        optA.value = idx;
        optA.textContent = getCornerName(idx);
        selFrom.appendChild(optA);

        const optB = document.createElement('option');
        optB.value = idx;
        optB.textContent = getCornerName(idx);
        selTo.appendChild(optB);
    });

    if (selTo.options.length > 2) selTo.selectedIndex = 2;
}

function addInternalChordFromSelect() {
    const selFrom = document.getElementById('chordFromCorner');
    const selTo = document.getElementById('chordToCorner');
    if (!selFrom || !selTo) return;

    const from = parseInt(selFrom.value, 10);
    const to = parseInt(selTo.value, 10);
    const n = Playground.points.length;

    if (from === to || (to + 1) % n === from || (from + 1) % n === to) {
        showToast(t('toastInputError'), 'error');
        return;
    }

    if (!Playground.chords) Playground.chords = [];

    // Check duplicate
    const exists = Playground.chords.some(c =>
        (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (exists) {
        showToast(t('toastChordExists'), 'warning');
        return;
    }

    Playground.chords.push({ from, to });
    Playground.hasDiagonal = true;
    renderPlayground();
    updateCalculationsAndUI();
    populateChordsList();
    showToast(t('toastChordAdded'), 'success');
}

function deleteChord(idx) {
    if (Playground.chords && Playground.chords[idx]) {
        Playground.chords.splice(idx, 1);
        if (Playground.chords.length === 0) Playground.hasDiagonal = false;
        renderPlayground();
        updateCalculationsAndUI();
        populateChordsList();
    }
}

function populateChordsList() {
    const container = document.getElementById('chordsListContainer');
    if (!container) return;

    const chords = Playground.chords;
    if (!chords || chords.length === 0) {
        container.innerHTML = `<div style="font-size:0.75rem; color:#64748b; padding:12px 0;">${t('noChords')}</div>`;
        return;
    }

    const pts = Playground.points;
    const isEn = (AppSettings.lang === 'en');
    const uM = isEn ? 'm' : 'م';

    let html = '';
    chords.forEach((c, idx) => {
        if (c.from < pts.length && c.to < pts.length) {
            const dist = Math.round(Math.hypot(pts[c.to].x - pts[c.from].x, pts[c.to].y - pts[c.from].y));
            html += `
                <div style="display:flex; align-items:center; justify-content:space-between; background:#090e17; border:1px solid #1e293b; padding:8px 12px; border-radius:8px; margin-bottom:6px;">
                    <div style="font-size:0.8rem; font-weight:800; color:#fde047;">${getChordName(c.from, c.to)}: ${dist}${uM}</div>
                    <button onclick="deleteChord(${idx})" style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#fca5a5; border-radius:6px; padding:3px 8px; font-size:0.7rem; font-weight:800; cursor:pointer;">${t('delete')}</button>
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

// Corner Angle Modal
function openCornerAngleModal(cornerIdx = 0) {
    activeAngleEditIndex = cornerIdx;
    const modal = document.getElementById('cornerAngleModal');
    const titleEl = document.getElementById('cornerAngleTitle');
    const valInput = document.getElementById('cornerAngleVal');

    const ang = getCornerAngle(cornerIdx);
    if (valInput) valInput.value = ang.toFixed(1);
    if (titleEl) titleEl.textContent = `${t('angleModalTitle')} (${getCornerName(cornerIdx)})`;

    if (modal) modal.classList.add('active');
    setTimeout(() => valInput?.select(), 100);
}

function closeCornerAngleModal() {
    const modal = document.getElementById('cornerAngleModal');
    if (modal) modal.classList.remove('active');
    activeAngleEditIndex = null;
}

function applyCornerAngle() {
    const valInput = document.getElementById('cornerAngleVal');
    const targetDeg = parseFloat(valInput?.value);
    if (isNaN(targetDeg) || targetDeg <= 0 || targetDeg >= 360) {
        showToast(t('toastInputError'), 'error');
        return;
    }

    if (activeAngleEditIndex !== null) {
        setCornerAngle(activeAngleEditIndex, targetDeg);
    }
    closeCornerAngleModal();
}

// Settings Persistence
function saveAppSettings() {
    AppSettings.lang = document.getElementById('setLanguage')?.value || 'ar';
    AppSettings.decimals = parseInt(document.getElementById('setDecimalPlaces')?.value || '2', 10);
    AppSettings.showCorners = document.getElementById('setCornersVisible')?.checked ?? true;
    AppSettings.autoSelectInput = document.getElementById('setAutoSelectInput')?.checked ?? true;

    try {
        localStorage.setItem('misaha_lang', AppSettings.lang);
        localStorage.setItem('misaha_decimals', AppSettings.decimals);
        localStorage.setItem('misaha_show_corners', AppSettings.showCorners);
        localStorage.setItem('misaha_auto_select', AppSettings.autoSelectInput);
    } catch (_) {}

    changeAppLanguage(AppSettings.lang);
    renderPlayground();
    updateCalculationsAndUI();
    showToast(t('toastSettingsSaved'), 'success');
}

function resetAppSettingsDefaults() {
    AppSettings.lang = 'ar';
    AppSettings.primaryUnit = 'feddan';
    AppSettings.decimals = 2;
    AppSettings.showCorners = true;
    AppSettings.autoSelectInput = true;

    try {
        localStorage.clear();
    } catch (_) {}

    initSettingsFromStorage();
    renderPlayground();
    updateCalculationsAndUI();
    showToast(t('toastResetDefaults'), 'info');
}

// Check for updates simulation
function checkAppUpdates() {
    const statusText = document.getElementById('updateStatusText');
    if (!statusText) return;

    statusText.textContent = t('updateChecking');
    statusText.style.color = '#38bdf8';

    setTimeout(() => {
        statusText.textContent = t('updateLatest');
        statusText.style.color = '#10b981';
    }, 1200);
}

// Toast Notifications System
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 20);

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
