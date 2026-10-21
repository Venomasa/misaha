/* ==========================================================================
   MISAHA 1+ - FIXED GEOMETRIC SHAPES ENGINE
   12 Geometric Shapes: accurate formulas, zero clipping & live diagram math
   ========================================================================== */

let selectedFixedShape = 'quad_diag';

const FIXED_SHAPES_DATA = {
    quad_diag: {
        id: 'quad_diag',
        nameKey: 'shape_quad_diag',
        badgeKey: 'shape_quad_diag_badge',
        defaults: { fA: 60, fB: 45, fC: 58, fD: 40, fDiag: 75 }
    },
    quad_avg: {
        id: 'quad_avg',
        nameKey: 'shape_quad_avg',
        badgeKey: 'shape_quad_avg_badge',
        defaults: { fA: 60, fB: 45, fC: 58, fD: 40 }
    },
    trapezoid: {
        id: 'trapezoid',
        nameKey: 'shape_trapezoid',
        badgeKey: 'shape_trapezoid_badge',
        defaults: { fBaseMinor: 40, fBaseMajor: 70, fHeight: 35 }
    },
    trapezoid_right: {
        id: 'trapezoid_right',
        nameKey: 'shape_trapezoid_right',
        badgeKey: 'shape_trapezoid_right_badge',
        defaults: { fTR_BaseMinor: 40, fTR_BaseMajor: 65, fTR_Height: 35 }
    },
    rect: {
        id: 'rect',
        nameKey: 'shape_rect',
        badgeKey: 'shape_rect_badge',
        defaults: { fRect_L: 60, fRect_W: 30 }
    },
    triangle: {
        id: 'triangle',
        nameKey: 'shape_triangle',
        badgeKey: 'shape_triangle_badge',
        defaults: { fTriA: 50, fTriB: 40, fTriC: 45 }
    },
    triangle_right: {
        id: 'triangle_right',
        nameKey: 'shape_triangle_right',
        badgeKey: 'shape_triangle_right_badge',
        defaults: { fTriRight_Height: 35, fTriRight_Base: 50 }
    },
    parallelogram: {
        id: 'parallelogram',
        nameKey: 'shape_parallelogram',
        badgeKey: 'shape_parallelogram_badge',
        defaults: { fPara_Base: 65, fPara_Side: 40, fPara_Height: 35 }
    },
    rhombus: {
        id: 'rhombus',
        nameKey: 'shape_rhombus',
        badgeKey: 'shape_rhombus_badge',
        defaults: { fRhomb_D1: 70, fRhomb_D2: 45 }
    },
    l_shape: {
        id: 'l_shape',
        nameKey: 'shape_l_shape',
        badgeKey: 'shape_l_shape_badge',
        defaults: { fL1: 40, fW1: 25, fL2: 30, fW2: 20 }
    },
    t_shape: {
        id: 't_shape',
        nameKey: 'shape_t_shape',
        badgeKey: 'shape_t_shape_badge',
        defaults: { fT_TopL: 50, fT_TopW: 20, fT_StemL: 40, fT_StemW: 20 }
    },
    pentagon_diag: {
        id: 'pentagon_diag',
        nameKey: 'shape_pentagon_diag',
        badgeKey: 'shape_pentagon_diag_badge',
        defaults: { fP_A: 40, fP_B: 45, fP_C: 50, fP_D: 42, fP_E: 38, fP_D1: 65, fP_D2: 60 }
    }
};

function selectShape(shapeId) {
    if (!FIXED_SHAPES_DATA[shapeId]) shapeId = 'quad_diag';
    selectedFixedShape = shapeId;

    // Toggle catalog vs calculator view
    const catalogView = document.getElementById('shapesCatalogView');
    const calcView = document.getElementById('shapeCalculatorView');
    if (catalogView) catalogView.classList.add('hidden');
    if (calcView) calcView.classList.remove('hidden');

    // Update active pill
    const activePill = document.getElementById('activeShapePill');
    if (activePill) {
        activePill.textContent = t(FIXED_SHAPES_DATA[shapeId].nameKey);
    }

    // Show corresponding inputs form
    document.querySelectorAll('.shape-inputs-group').forEach(grp => grp.classList.add('hidden'));
    const targetGrp = document.getElementById(`form_${shapeId}`);
    if (targetGrp) targetGrp.classList.remove('hidden');

    // Set default values if empty
    const defs = FIXED_SHAPES_DATA[shapeId].defaults;
    for (const [id, val] of Object.entries(defs)) {
        const inp = document.getElementById(id);
        if (inp && (!inp.value || inp.value === '0')) {
            inp.value = val;
        }
    }

    renderFixedShapeDiagram();
    updateFixedDiagramLive();
}

function backToShapesCatalog() {
    const catalogView = document.getElementById('shapesCatalogView');
    const calcView = document.getElementById('shapeCalculatorView');
    if (calcView) calcView.classList.add('hidden');
    if (catalogView) catalogView.classList.remove('hidden');
}

function renderFixedShapeDiagram() {
    const svg = document.getElementById('fixedShapeSvg');
    if (!svg) return;

    const isEn = (AppSettings.lang === 'en');
    const c = isEn
        ? ['A', 'B', 'C', 'D', 'E', 'F']
        : ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

    // Adjusted viewBox 0 0 400 220 with safe margins to avoid any clipping!
    svg.setAttribute('viewBox', '0 0 400 220');

    if (selectedFixedShape === 'quad_diag') {
        svg.innerHTML = `
            <polygon points="105,48 295,42 275,178 85,168" class="diag-poly" />
            <line id="edge_fDiag" x1="85" y1="168" x2="295" y2="42" class="diag-line-dashed" />
            <line id="edge_fA" x1="105" y1="48" x2="295" y2="42" class="diag-edge" />
            <line id="edge_fB" x1="295" y1="42" x2="275" y2="178" class="diag-edge" />
            <line id="edge_fC" x1="275" y1="178" x2="85" y2="168" class="diag-edge" />
            <line id="edge_fD" x1="85" y1="168" x2="105" y2="48" class="diag-edge" />

            <g transform="translate(105,48)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(295,42)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(275,178)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(85,168)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>

            <g id="tag_fA" class="diagram-tag" transform="translate(200, 26)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fA">---</text></g>
            <g id="tag_fB" class="diagram-tag" transform="translate(330, 110)"><rect x="-52" y="-12" width="104" height="24" rx="6" /><text id="lbl_fB">---</text></g>
            <g id="tag_fC" class="diagram-tag" transform="translate(180, 196)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fC">---</text></g>
            <g id="tag_fD" class="diagram-tag" transform="translate(56, 108)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_fD">---</text></g>
            <g id="tag_fDiag" class="diagram-tag diag-tag-amber" transform="translate(190, 105)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fDiag">---</text></g>
        `;
    } else if (selectedFixedShape === 'quad_avg') {
        svg.innerHTML = `
            <polygon points="105,48 295,42 275,178 85,168" class="diag-poly" />
            <line id="edge_fA" x1="105" y1="48" x2="295" y2="42" class="diag-edge" />
            <line id="edge_fB" x1="295" y1="42" x2="275" y2="178" class="diag-edge" />
            <line id="edge_fC" x1="275" y1="178" x2="85" y2="168" class="diag-edge" />
            <line id="edge_fD" x1="85" y1="168" x2="105" y2="48" class="diag-edge" />

            <g transform="translate(105,48)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(295,42)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(275,178)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(85,168)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>

            <g id="tag_fA" class="diagram-tag" transform="translate(200, 26)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fA">---</text></g>
            <g id="tag_fB" class="diagram-tag" transform="translate(330, 110)"><rect x="-52" y="-12" width="104" height="24" rx="6" /><text id="lbl_fB">---</text></g>
            <g id="tag_fC" class="diagram-tag" transform="translate(180, 196)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fC">---</text></g>
            <g id="tag_fD" class="diagram-tag" transform="translate(56, 108)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_fD">---</text></g>
        `;
    } else if (selectedFixedShape === 'trapezoid') {
        svg.innerHTML = `
            <polygon points="140,50 260,50 320,175 80,175" class="diag-poly" />
            <line id="edge_fBaseMinor" x1="140" y1="50" x2="260" y2="50" class="diag-edge" />
            <line id="edge_fBaseMajor" x1="80" y1="175" x2="320" y2="175" class="diag-edge" />
            <line id="edge_fHeight" x1="200" y1="50" x2="200" y2="175" class="diag-line-dashed" />

            <g transform="translate(140,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(260,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(320,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(80,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>

            <g id="tag_fBaseMinor" class="diagram-tag" transform="translate(200, 26)"><rect x="-60" y="-12" width="120" height="24" rx="6" /><text id="lbl_fBaseMinor">---</text></g>
            <g id="tag_fBaseMajor" class="diagram-tag" transform="translate(200, 196)"><rect x="-60" y="-12" width="120" height="24" rx="6" /><text id="lbl_fBaseMajor">---</text></g>
            <g id="tag_fHeight" class="diagram-tag diag-tag-amber" transform="translate(200, 112)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_fHeight">---</text></g>
        `;
    } else if (selectedFixedShape === 'trapezoid_right') {
        svg.innerHTML = `
            <polygon points="100,50 240,50 320,175 100,175" class="diag-poly" />
            <line id="edge_fHeight" x1="100" y1="50" x2="100" y2="175" class="diag-edge" />
            <line id="edge_fBaseMinor" x1="100" y1="50" x2="240" y2="50" class="diag-edge" />
            <line id="edge_fBaseMajor" x1="100" y1="175" x2="320" y2="175" class="diag-edge" />
            <polyline points="100,65 115,65 115,50" fill="none" stroke="#10b981" stroke-width="1.5" />
            <polyline points="100,160 115,160 115,175" fill="none" stroke="#10b981" stroke-width="1.5" />

            <g transform="translate(100,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(240,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(320,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(100,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>

            <g id="tag_fBaseMinor" class="diagram-tag" transform="translate(170, 26)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_TR_BaseMinor">---</text></g>
            <g id="tag_fBaseMajor" class="diagram-tag" transform="translate(210, 196)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_TR_BaseMajor">---</text></g>
            <g id="tag_fHeight" class="diagram-tag diag-tag-amber" transform="translate(55, 112)"><rect x="-48" y="-12" width="96" height="24" rx="6" /><text id="lbl_TR_Height">---</text></g>
        `;
    } else if (selectedFixedShape === 'rect') {
        svg.innerHTML = `
            <polygon points="70,50 310,50 310,170 70,170" class="diag-poly" />
            <line id="edge_fRect_L" x1="70" y1="50" x2="310" y2="50" class="diag-edge" />
            <line id="edge_fRect_W" x1="310" y1="50" x2="310" y2="170" class="diag-edge" />
            <polyline points="70,65 85,65 85,50" fill="none" stroke="#10b981" stroke-width="1.5" />
            <polyline points="295,50 295,65 310,65" fill="none" stroke="#10b981" stroke-width="1.5" />

            <g transform="translate(70,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(310,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(310,170)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(70,170)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>

            <g id="tag_fRect_L" class="diagram-tag" transform="translate(190, 26)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fRect_L">---</text></g>
            <g id="tag_fRect_W" class="diagram-tag" transform="translate(345, 110)"><rect x="-48" y="-12" width="96" height="24" rx="6" /><text id="lbl_fRect_W">---</text></g>
        `;
    } else if (selectedFixedShape === 'triangle') {
        svg.innerHTML = `
            <polygon points="200,35 325,175 75,175" class="diag-poly" />
            <line id="edge_fTriA" x1="200" y1="35" x2="325" y2="175" class="diag-edge" />
            <line id="edge_fTriB" x1="325" y1="175" x2="75" y2="175" class="diag-edge" />
            <line id="edge_fTriC" x1="75" y1="175" x2="200" y2="35" class="diag-edge" />

            <g transform="translate(200,35)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(325,175)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(75,175)"><circle r="12" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>

            <g id="tag_fTriA" class="diagram-tag" transform="translate(285, 95)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fTriA">---</text></g>
            <g id="tag_fTriB" class="diagram-tag" transform="translate(200, 196)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fTriB">---</text></g>
            <g id="tag_fTriC" class="diagram-tag" transform="translate(115, 95)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_fTriC">---</text></g>
        `;
    } else if (selectedFixedShape === 'triangle_right') {
        svg.innerHTML = `
            <polygon points="100,45 100,175 310,175" class="diag-poly" />
            <line id="edge_fTriRight_Height" x1="100" y1="45" x2="100" y2="175" class="diag-edge" />
            <line id="edge_fTriRight_Base" x1="100" y1="175" x2="310" y2="175" class="diag-edge" />
            <line x1="100" y1="45" x2="310" y2="175" class="diag-edge" />
            <polyline points="100,160 115,160 115,175" fill="none" stroke="#10b981" stroke-width="1.5" />

            <g transform="translate(100,45)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(310,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(100,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>

            <g id="tag_fTriRight_Height" class="diagram-tag diag-tag-amber" transform="translate(56, 105)"><rect x="-48" y="-12" width="96" height="24" rx="6" /><text id="lbl_TriRight_Height">---</text></g>
            <g id="tag_fTriRight_Base" class="diagram-tag" transform="translate(205, 196)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_TriRight_Base">---</text></g>
        `;
    } else if (selectedFixedShape === 'parallelogram') {
        svg.innerHTML = `
            <polygon points="120,50 310,50 260,175 70,175" class="diag-poly" />
            <line id="edge_fPara_Height" x1="120" y1="50" x2="120" y2="175" class="diag-line-dashed" />
            <line id="edge_fPara_Base" x1="70" y1="175" x2="260" y2="175" class="diag-edge" />
            <line id="edge_fPara_Side" x1="310" y1="50" x2="260" y2="175" class="diag-edge" />
            <polyline points="120,160 135,160 135,175" fill="none" stroke="#f59e0b" stroke-width="1.5" />

            <g transform="translate(120,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(310,50)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(260,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(70,175)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>

            <g id="tag_fPara_Base" class="diagram-tag" transform="translate(215, 26)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_Para_Base">---</text></g>
            <g id="tag_fPara_Side" class="diagram-tag" transform="translate(305, 115)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_Para_Side">---</text></g>
            <g id="tag_fPara_Height" class="diagram-tag diag-tag-amber" transform="translate(120, 112)"><rect x="-45" y="-12" width="90" height="24" rx="6" /><text id="lbl_Para_Height">---</text></g>
        `;
    } else if (selectedFixedShape === 'rhombus') {
        svg.innerHTML = `
            <polygon points="200,35 320,110 200,185 80,110" class="diag-poly" />
            <line id="edge_fRhomb_D1" x1="200" y1="35" x2="200" y2="185" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="4,3" />
            <line id="edge_fRhomb_D2" x1="80" y1="110" x2="320" y2="110" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="4,3" />

            <g id="tag_fRhomb_D1" class="diagram-tag diag-tag-amber" transform="translate(200, 20)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_Rhomb_D1">---</text></g>
            <g id="tag_fRhomb_D2" class="diagram-tag diag-tag-amber" transform="translate(335, 110)"><rect x="-52" y="-12" width="104" height="24" rx="6" /><text id="lbl_Rhomb_D2">---</text></g>
        `;
    } else if (selectedFixedShape === 'l_shape') {
        svg.innerHTML = `
            <polygon points="75,35 185,35 185,105 315,105 315,180 75,180" class="diag-poly" />
            <line x1="185" y1="105" x2="185" y2="180" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="4,3" />
            <line id="edge_fL1" x1="75" y1="35" x2="185" y2="35" class="diag-edge" />
            <line id="edge_fW1" x1="75" y1="35" x2="75" y2="180" class="diag-edge" />
            <line id="edge_fL2" x1="185" y1="105" x2="315" y2="105" class="diag-edge" />
            <line id="edge_fW2" x1="315" y1="105" x2="315" y2="180" class="diag-edge" />

            <g id="tag_fL1" class="diagram-tag" transform="translate(130, 20)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_fL1">---</text></g>
            <g id="tag_fW1" class="diagram-tag" transform="translate(48, 110)"><rect x="-42" y="-12" width="84" height="24" rx="6" /><text id="lbl_fW1">---</text></g>
            <g id="tag_fL2" class="diagram-tag" transform="translate(250, 90)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_fL2">---</text></g>
            <g id="tag_fW2" class="diagram-tag" transform="translate(340, 142)"><rect x="-44" y="-12" width="88" height="24" rx="6" /><text id="lbl_fW2">---</text></g>
        `;
    } else if (selectedFixedShape === 't_shape') {
        svg.innerHTML = `
            <polygon points="75,35 315,35 315,90 225,90 225,185 165,185 165,90 75,90" class="diag-poly" />
            <line x1="165" y1="90" x2="225" y2="90" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,3" />
            <line id="edge_fT_TopL" x1="75" y1="35" x2="315" y2="35" class="diag-edge" />
            <line id="edge_fT_TopW" x1="315" y1="35" x2="315" y2="90" class="diag-edge" />
            <line id="edge_fT_StemL" x1="225" y1="90" x2="225" y2="185" class="diag-edge" />
            <line id="edge_fT_StemW" x1="165" y1="185" x2="225" y2="185" class="diag-edge" />

            <g id="tag_fT_TopL" class="diagram-tag" transform="translate(195, 20)"><rect x="-55" y="-12" width="110" height="24" rx="6" /><text id="lbl_T_TopL">---</text></g>
            <g id="tag_fT_TopW" class="diagram-tag" transform="translate(345, 62)"><rect x="-42" y="-12" width="84" height="24" rx="6" /><text id="lbl_T_TopW">---</text></g>
            <g id="tag_fT_StemL" class="diagram-tag" transform="translate(195, 140)"><rect x="-50" y="-12" width="100" height="24" rx="6" /><text id="lbl_T_StemL">---</text></g>
        `;
    } else if (selectedFixedShape === 'pentagon_diag') {
        svg.innerHTML = `
            <polygon points="200,35 325,100 280,185 120,185 75,100" class="diag-poly" />
            <line id="edge_fP_A" x1="200" y1="35" x2="325" y2="100" class="diag-edge" />
            <line id="edge_fP_B" x1="325" y1="100" x2="280" y2="185" class="diag-edge" />
            <line id="edge_fP_C" x1="280" y1="185" x2="120" y2="185" class="diag-edge" />
            <line id="edge_fP_D" x1="120" y1="185" x2="75" y2="100" class="diag-edge" />
            <line id="edge_fP_E" x1="75" y1="100" x2="200" y2="35" class="diag-edge" />
            <line id="edge_fP_D1" x1="200" y1="35" x2="280" y2="185" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,4" />
            <line id="edge_fP_D2" x1="200" y1="35" x2="120" y2="185" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,4" />

            <g transform="translate(200,35)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[0]}</text></g>
            <g transform="translate(325,100)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[1]}</text></g>
            <g transform="translate(280,185)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[2]}</text></g>
            <g transform="translate(120,185)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[3]}</text></g>
            <g transform="translate(75,100)"><circle r="11" class="diag-corner-circle"/><text class="diag-corner-text">${c[4]}</text></g>

            <g id="tag_fP_A" class="diagram-tag" transform="translate(265, 60)"><rect x="-45" y="-10" width="90" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981"/><text id="lbl_fP_A" font-size="9" fill="#a7f3d0" text-anchor="middle" dominant-baseline="central">---</text></g>
            <g id="tag_fP_B" class="diagram-tag" transform="translate(315, 145)"><rect x="-45" y="-10" width="90" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981"/><text id="lbl_fP_B" font-size="9" fill="#a7f3d0" text-anchor="middle" dominant-baseline="central">---</text></g>
            <g id="tag_fP_C" class="diagram-tag" transform="translate(200, 196)"><rect x="-45" y="-10" width="90" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981"/><text id="lbl_fP_C" font-size="9" fill="#a7f3d0" text-anchor="middle" dominant-baseline="central">---</text></g>
            <g id="tag_fP_D" class="diagram-tag" transform="translate(85, 145)"><rect x="-45" y="-10" width="90" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981"/><text id="lbl_fP_D" font-size="9" fill="#a7f3d0" text-anchor="middle" dominant-baseline="central">---</text></g>
            <g id="tag_fP_E" class="diagram-tag" transform="translate(130, 60)"><rect x="-45" y="-10" width="90" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981"/><text id="lbl_fP_E" font-size="9" fill="#a7f3d0" text-anchor="middle" dominant-baseline="central">---</text></g>
            <g id="tag_fP_D1" class="diagram-tag diag-tag-amber" transform="translate(235, 110)"><rect x="-42" y="-10" width="84" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#f59e0b"/><text id="lbl_fP_D1" font-size="9" fill="#fde047" text-anchor="middle" dominant-baseline="central">---</text></g>
            <g id="tag_fP_D2" class="diagram-tag diag-tag-amber" transform="translate(155, 110)"><rect x="-42" y="-10" width="84" height="20" rx="4" fill="rgba(15,23,42,0.9)" stroke="#f59e0b"/><text id="lbl_fP_D2" font-size="9" fill="#fde047" text-anchor="middle" dominant-baseline="central">---</text></g>
        `;
    }
}

function updateFixedDiagramLive() {
    let areaM2 = 0;
    let perimeterM = 0;
    const isEn = (AppSettings.lang === 'en');
    const uM = isEn ? 'm' : 'م';

    const setTxt = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    if (selectedFixedShape === 'quad_diag') {
        const a = parseFloat(document.getElementById('fA')?.value) || 0;
        const b = parseFloat(document.getElementById('fB')?.value) || 0;
        const c = parseFloat(document.getElementById('fC')?.value) || 0;
        const d = parseFloat(document.getElementById('fD')?.value) || 0;
        const diag = parseFloat(document.getElementById('fDiag')?.value) || 0;

        setTxt('lbl_fA', `${getEdgeName(0, 1)}: ${a}${uM}`);
        setTxt('lbl_fB', `${getEdgeName(1, 2)}: ${b}${uM}`);
        setTxt('lbl_fC', `${getEdgeName(2, 3)}: ${c}${uM}`);
        setTxt('lbl_fD', `${getEdgeName(3, 0)}: ${d}${uM}`);
        setTxt('lbl_fDiag', `${getChordName(1, 3)}: ${diag}${uM}`);

        perimeterM = a + b + c + d;
        const s1 = (a + b + diag) / 2;
        const a1 = Math.sqrt(Math.max(0, s1 * (s1 - a) * (s1 - b) * (s1 - diag)));
        const s2 = (c + d + diag) / 2;
        const a2 = Math.sqrt(Math.max(0, s2 * (s2 - c) * (s2 - d) * (s2 - diag)));
        areaM2 = a1 + a2;
    } else if (selectedFixedShape === 'quad_avg') {
        const a = parseFloat(document.getElementById('fA')?.value) || 0;
        const b = parseFloat(document.getElementById('fB')?.value) || 0;
        const c = parseFloat(document.getElementById('fC')?.value) || 0;
        const d = parseFloat(document.getElementById('fD')?.value) || 0;

        setTxt('lbl_fA', `${getEdgeName(0, 1)}: ${a}${uM}`);
        setTxt('lbl_fB', `${getEdgeName(1, 2)}: ${b}${uM}`);
        setTxt('lbl_fC', `${getEdgeName(2, 3)}: ${c}${uM}`);
        setTxt('lbl_fD', `${getEdgeName(3, 0)}: ${d}${uM}`);

        perimeterM = a + b + c + d;
        areaM2 = ((a + c) / 2) * ((b + d) / 2);
    } else if (selectedFixedShape === 'trapezoid') {
        const bMinor = parseFloat(document.getElementById('fBaseMinor')?.value) || 0;
        const bMajor = parseFloat(document.getElementById('fBaseMajor')?.value) || 0;
        const h = parseFloat(document.getElementById('fHeight')?.value) || 0;

        const minorTxt = isEn ? `Minor Base: ${bMinor}m` : `قاعدة صغرى: ${bMinor}م`;
        const majorTxt = isEn ? `Major Base: ${bMajor}m` : `قاعدة كبرى: ${bMajor}م`;
        const hTxt = isEn ? `Height: ${h}m` : `الارتفاع: ${h}م`;
        setTxt('lbl_fBaseMinor', minorTxt);
        setTxt('lbl_fBaseMajor', majorTxt);
        setTxt('lbl_fHeight', hTxt);

        areaM2 = ((bMajor + bMinor) / 2) * h;
        perimeterM = bMajor + bMinor + 2 * Math.hypot((bMajor - bMinor) / 2, h);
    } else if (selectedFixedShape === 'trapezoid_right') {
        const bMinor = parseFloat(document.getElementById('fTR_BaseMinor')?.value) || 0;
        const bMajor = parseFloat(document.getElementById('fTR_BaseMajor')?.value) || 0;
        const h = parseFloat(document.getElementById('fTR_Height')?.value) || 0;

        const minorTxt = isEn ? `Minor Base: ${bMinor}m` : `قاعدة صغرى: ${bMinor}م`;
        const majorTxt = isEn ? `Major Base: ${bMajor}m` : `قاعدة كبرى: ${bMajor}م`;
        const hTxt = isEn ? `Height: ${h}m` : `الارتفاع: ${h}م`;
        setTxt('lbl_TR_BaseMinor', minorTxt);
        setTxt('lbl_TR_BaseMajor', majorTxt);
        setTxt('lbl_TR_Height', hTxt);

        areaM2 = ((bMajor + bMinor) / 2) * h;
        const slant = Math.hypot(bMajor - bMinor, h);
        perimeterM = bMajor + bMinor + h + slant;
    } else if (selectedFixedShape === 'rect') {
        const l = parseFloat(document.getElementById('fRect_L')?.value) || 0;
        const w = parseFloat(document.getElementById('fRect_W')?.value) || 0;

        setTxt('lbl_fRect_L', `${isEn ? 'Length' : 'الطول'}: ${l}${uM}`);
        setTxt('lbl_fRect_W', `${isEn ? 'Width' : 'العرض'}: ${w}${uM}`);

        areaM2 = l * w;
        perimeterM = 2 * (l + w);
    } else if (selectedFixedShape === 'triangle') {
        const a = parseFloat(document.getElementById('fTriA')?.value) || 0;
        const b = parseFloat(document.getElementById('fTriB')?.value) || 0;
        const c = parseFloat(document.getElementById('fTriC')?.value) || 0;

        setTxt('lbl_fTriA', `${getEdgeName(0, 1)}: ${a}${uM}`);
        setTxt('lbl_fTriB', `${getEdgeName(1, 2)}: ${b}${uM}`);
        setTxt('lbl_fTriC', `${getEdgeName(2, 0)}: ${c}${uM}`);

        perimeterM = a + b + c;
        const s = perimeterM / 2;
        areaM2 = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    } else if (selectedFixedShape === 'triangle_right') {
        const h = parseFloat(document.getElementById('fTriRight_Height')?.value) || 0;
        const b = parseFloat(document.getElementById('fTriRight_Base')?.value) || 0;

        setTxt('lbl_TriRight_Height', `${isEn ? 'Height' : 'الارتفاع'}: ${h}${uM}`);
        setTxt('lbl_TriRight_Base', `${isEn ? 'Base' : 'القاعدة'}: ${b}${uM}`);

        areaM2 = (b * h) / 2;
        const hyp = Math.hypot(b, h);
        perimeterM = b + h + hyp;
    } else if (selectedFixedShape === 'parallelogram') {
        const b = parseFloat(document.getElementById('fPara_Base')?.value) || 0;
        const side = parseFloat(document.getElementById('fPara_Side')?.value) || 0;
        const h = parseFloat(document.getElementById('fPara_Height')?.value) || 0;

        setTxt('lbl_Para_Base', `${isEn ? 'Base' : 'القاعدة'}: ${b}${uM}`);
        setTxt('lbl_Para_Side', `${isEn ? 'Side' : 'الجانب'}: ${side}${uM}`);
        setTxt('lbl_Para_Height', `${isEn ? 'Height' : 'الارتفاع'}: ${h}${uM}`);

        areaM2 = b * h;
        perimeterM = 2 * (b + side);
    } else if (selectedFixedShape === 'rhombus') {
        const d1 = parseFloat(document.getElementById('fRhomb_D1')?.value) || 0;
        const d2 = parseFloat(document.getElementById('fRhomb_D2')?.value) || 0;

        setTxt('lbl_Rhomb_D1', `${isEn ? 'Diagonal 1' : 'القطر 1'}: ${d1}${uM}`);
        setTxt('lbl_Rhomb_D2', `${isEn ? 'Diagonal 2' : 'القطر 2'}: ${d2}${uM}`);

        areaM2 = (d1 * d2) / 2;
        const side = Math.hypot(d1 / 2, d2 / 2);
        perimeterM = 4 * side;
    } else if (selectedFixedShape === 'l_shape') {
        const l1 = parseFloat(document.getElementById('fL1')?.value) || 0;
        const w1 = parseFloat(document.getElementById('fW1')?.value) || 0;
        const l2 = parseFloat(document.getElementById('fL2')?.value) || 0;
        const w2 = parseFloat(document.getElementById('fW2')?.value) || 0;

        setTxt('lbl_fL1', `${isEn ? 'L1' : 'طول 1'}: ${l1}${uM}`);
        setTxt('lbl_fW1', `${isEn ? 'W1' : 'عرض 1'}: ${w1}${uM}`);
        setTxt('lbl_fL2', `${isEn ? 'L2' : 'طول 2'}: ${l2}${uM}`);
        setTxt('lbl_fW2', `${isEn ? 'W2' : 'عرض 2'}: ${w2}${uM}`);

        areaM2 = (l1 * w1) + (l2 * w2);
        perimeterM = 2 * (Math.max(l1, l2) + w1 + w2);
    } else if (selectedFixedShape === 't_shape') {
        const topL = parseFloat(document.getElementById('fT_TopL')?.value) || 0;
        const topW = parseFloat(document.getElementById('fT_TopW')?.value) || 0;
        const stemL = parseFloat(document.getElementById('fT_StemL')?.value) || 0;
        const stemW = parseFloat(document.getElementById('fT_StemW')?.value) || 0;

        setTxt('lbl_T_TopL', `${isEn ? 'Top L' : 'طول علوي'}: ${topL}${uM}`);
        setTxt('lbl_T_TopW', `${isEn ? 'Top W' : 'عرض'}: ${topW}${uM}`);
        setTxt('lbl_T_StemL', `${isEn ? 'Stem L' : 'طول الساق'}: ${stemL}${uM}`);

        areaM2 = (topL * topW) + (stemL * stemW);
        perimeterM = 2 * topL + 2 * (topW + stemL);
    } else if (selectedFixedShape === 'pentagon_diag') {
        const a = parseFloat(document.getElementById('fP_A')?.value) || 0;
        const b = parseFloat(document.getElementById('fP_B')?.value) || 0;
        const c = parseFloat(document.getElementById('fP_C')?.value) || 0;
        const d = parseFloat(document.getElementById('fP_D')?.value) || 0;
        const e = parseFloat(document.getElementById('fP_E')?.value) || 0;
        const d1 = parseFloat(document.getElementById('fP_D1')?.value) || 0;
        const d2 = parseFloat(document.getElementById('fP_D2')?.value) || 0;

        setTxt('lbl_fP_A', `${getEdgeName(0, 1)}: ${a}${uM}`);
        setTxt('lbl_fP_B', `${getEdgeName(1, 2)}: ${b}${uM}`);
        setTxt('lbl_fP_C', `${getEdgeName(2, 3)}: ${c}${uM}`);
        setTxt('lbl_fP_D', `${getEdgeName(3, 4)}: ${d}${uM}`);
        setTxt('lbl_fP_E', `${getEdgeName(4, 0)}: ${e}${uM}`);
        setTxt('lbl_fP_D1', `${getChordName(0, 2)}: ${d1}${uM}`);
        setTxt('lbl_fP_D2', `${getChordName(0, 3)}: ${d2}${uM}`);

        perimeterM = a + b + c + d + e;

        // Tri 1: a, b, d1
        const s1 = (a + b + d1) / 2;
        const a1 = Math.sqrt(Math.max(0, s1 * (s1 - a) * (s1 - b) * (s1 - d1)));
        // Tri 2: d1, c, d2
        const s2 = (d1 + c + d2) / 2;
        const a2 = Math.sqrt(Math.max(0, s2 * (s2 - d1) * (s2 - c) * (s2 - d2)));
        // Tri 3: d2, d, e
        const s3 = (d2 + d + e) / 2;
        const a3 = Math.sqrt(Math.max(0, s3 * (s3 - d2) * (s3 - d) * (s3 - e)));

        areaM2 = a1 + a2 + a3;
    }

    const liveBadge = document.getElementById('diagramLiveBadge');
    if (liveBadge) {
        liveBadge.textContent = `${formatNum(areaM2)} ${isEn ? 'm²' : 'م²'}`;
    }

    return { areaM2, perimeterM };
}

function calculateFixedShapeResults() {
    const res = updateFixedDiagramLive();
    if (typeof displayResultsSheet === 'function') {
        displayResultsSheet(res.areaM2, res.perimeterM);
    }
}
