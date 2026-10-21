/* ==========================================================================
   MISAHA 1+ - GEOMETRIC ENGINE
   Accurate 2D Cadastral mathematics, Heron, Shoelace, angles & bisectors
   ========================================================================== */

const QASABA_LINEAR = 3.55;
const QASABA_SQUARE = 12.6025;
const FEDDAN_M2 = 4200.833;
const QIRAT_M2 = 175.0347;
const SAHM_M2 = 7.2931;

const Playground = {
    // Real-world coordinates in meters
    points: [
        { x: 100, y: 100 },
        { x: 350, y: 120 },
        { x: 310, y: 320 },
        { x: 80,  y: 280 }
    ],
    chords: [
        { from: 0, to: 2 }
    ],
    hasDiagonal: true,
    moveEnabled: true,
    activeTool: 'move', // 'move', 'add', 'del'
    zoom: 1.0,
    panX: 0,
    panY: 0,
    gridVisible: true,
    dragCornerIndex: null,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    initialPanX: 0,
    initialPanY: 0
};

// Calculate Area via Shoelace Formula
function calculateShoelace(pts) {
    if (!pts || pts.length < 3) return 0;
    let sum = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        sum += (p1.x * p2.y) - (p2.x * p1.y);
    }
    return Math.abs(sum) / 2;
}

// Calculate signed polygon area to determine winding order (positive = CCW, negative = CW)
function calculateSignedArea(pts) {
    if (!pts || pts.length < 3) return 0;
    let sum = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        sum += (p1.x * p2.y) - (p2.x * p1.y);
    }
    return sum / 2;
}

// Calculate Perimeter in meters
function calculatePerimeter(pts) {
    if (!pts || pts.length < 2) return 0;
    let perim = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        perim += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    return perim;
}

// Break down square meters into Feddan, Qirat, and Sahm
function decomposeFeddan(sqm) {
    if (sqm <= 0 || isNaN(sqm)) {
        return { feddans: 0, qirats: 0, sahms: 0, rawSqm: 0 };
    }
    let f = Math.floor(sqm / FEDDAN_M2);
    let rem = sqm - (f * FEDDAN_M2);
    let q = Math.floor(rem / QIRAT_M2);
    rem = rem - (q * QIRAT_M2);
    let s = Math.round(rem / SAHM_M2);

    if (s >= 24) { q += 1; s = 0; }
    if (q >= 24) { f += 1; q = 0; }

    return { feddans: f, qirats: q, sahms: s, rawSqm: sqm };
}

// Format numbers according to AppSettings precision
function formatNum(val, dec = null) {
    const d = (dec !== null) ? dec : (AppSettings.decimals ?? 2);
    const num = Number(val) || 0;
    if (d === 0) {
        return Math.round(num).toLocaleString('en-US');
    }
    return num.toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d
    });
}

// Corner Angle in Degrees (0 - 180°)
function getCornerAngle(i) {
    const pts = Playground.points;
    const n = pts.length;
    if (n < 3) return 0;
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const cross = v1.x * v2.y - v1.y * v2.x;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;

    const rad = Math.atan2(Math.abs(cross), dot);
    return Math.round(rad * (180 / Math.PI) * 10) / 10;
}

// Compute Unit Bisector Vectors (Inward & Outward) for a vertex
function getCornerBisectors(pts, i) {
    const n = pts.length;
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const m1 = Math.hypot(v1.x, v1.y) || 1;
    const m2 = Math.hypot(v2.x, v2.y) || 1;

    const u1 = { x: v1.x / m1, y: v1.y / m1 };
    const u2 = { x: v2.x / m2, y: v2.y / m2 };

    let bisX = u1.x + u2.x;
    let bisY = u1.y + u2.y;
    let bisMag = Math.hypot(bisX, bisY);

    if (bisMag < 0.0001) {
        // Collinear opposite edges (180° straight angle)
        bisX = -u1.y;
        bisY = u1.x;
        bisMag = 1;
    } else {
        bisX /= bisMag;
        bisY /= bisMag;
    }

    // Determine polygon orientation: CCW or CW
    const isCCW = calculateSignedArea(pts) >= 0;
    // Cross product of v1 x v2
    const cross = u1.x * u2.y - u1.y * u2.x;
    const isConvex = isCCW ? (cross > 0) : (cross < 0);

    let inX = bisX;
    let inY = bisY;
    let outX = -bisX;
    let outY = -bisY;

    if (!isConvex) {
        // Reflex corner (> 180°)
        inX = -bisX;
        inY = -bisY;
        outX = bisX;
        outY = bisY;
    }

    return {
        inward: { x: inX, y: inY },
        outward: { x: outX, y: outY },
        u1,
        u2,
        isConvex
    };
}

// World to Screen Coordinate Transform
function worldToScreen(wx, wy) {
    const svg = document.getElementById('landSvg');
    if (!svg) return { x: wx, y: wy };
    const rect = svg.getBoundingClientRect();
    const cx = (rect.width || 400) / 2;
    const cy = (rect.height || 400) / 2;
    return {
        x: cx + (wx + Playground.panX - 220) * Playground.zoom,
        y: cy + (wy + Playground.panY - 200) * Playground.zoom
    };
}

// Screen to World Coordinate Transform
function screenToWorld(sx, sy) {
    const svg = document.getElementById('landSvg');
    if (!svg) return { x: sx, y: sy };
    const rect = svg.getBoundingClientRect();
    const cx = (rect.width || 400) / 2;
    const cy = (rect.height || 400) / 2;
    return {
        x: 220 - Playground.panX + (sx - cx) / Playground.zoom,
        y: 200 - Playground.panY + (sy - cy) / Playground.zoom
    };
}

// Fit Playground View
function fitPlaygroundView() {
    const pts = Playground.points;
    if (!pts || pts.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    const svg = document.getElementById('landSvg');
    const rect = svg ? svg.getBoundingClientRect() : { width: 400, height: 400 };
    const w = Math.max(20, maxX - minX);
    const h = Math.max(20, maxY - minY);
    const pad = 90;
    const scale = Math.min((rect.width - pad * 2) / w, (rect.height - pad * 2) / h);

    Playground.zoom = Math.max(0.4, Math.min(2.5, scale));
    Playground.panX = 220 - (minX + maxX) / 2;
    Playground.panY = 200 - (minY + maxY) / 2;

    if (typeof renderPlayground === 'function') renderPlayground();
}

// Rotate Playground by Degrees
function rotatePlayground(deg = 90) {
    const pts = Playground.points;
    if (pts.length < 3) return;

    // Compute center of bounding box
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; });
    cx /= pts.length;
    cy /= pts.length;

    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    Playground.points = pts.map(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
            x: Math.round(cx + dx * cos - dy * sin),
            y: Math.round(cy + dx * sin + dy * cos)
        };
    });

    if (typeof renderPlayground === 'function') renderPlayground();
    if (typeof updateCalculationsAndUI === 'function') updateCalculationsAndUI();
}

// Adjust single corner angle while preserving adjacent edge lengths
function setCornerAngle(i, targetDeg) {
    const pts = Playground.points;
    const n = pts.length;
    if (n < 3) return;
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const lenNext = Math.hypot(v2.x, v2.y);

    const theta1 = Math.atan2(v1.y, v1.x);
    const currentTheta2 = Math.atan2(v2.y, v2.x);
    let diff = currentTheta2 - theta1;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    const sign = diff >= 0 ? 1 : -1;
    const targetRad = (targetDeg * Math.PI) / 180;
    const newTheta2 = theta1 + (sign * targetRad);

    next.x = Math.round(curr.x + Math.cos(newTheta2) * lenNext);
    next.y = Math.round(curr.y + Math.sin(newTheta2) * lenNext);

    if (typeof renderPlayground === 'function') renderPlayground();
    if (typeof updateCalculationsAndUI === 'function') updateCalculationsAndUI();
}
