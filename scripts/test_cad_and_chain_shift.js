const assert = require('assert');

console.log('=== RUNNING AUTOMATED UNIT TESTS FOR CAD & CHAIN SHIFT ===');

// Helper functions matching geometry.js / index.html
function dist(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

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

function adjustEdgeLength(pts, i, next, newLen, mode = 'chain') {
    const n = pts.length;
    if (n < 2) return;
    const pA = pts[i];
    const pB = pts[next];
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const curLen = Math.hypot(dx, dy);
    if (curLen === 0) return;

    const diff = newLen - curLen;
    const ux = dx / curLen;
    const uy = dy / curLen;

    if (mode === 'single') {
        pB.x = Math.round(pA.x + ux * newLen);
        pB.y = Math.round(pA.y + uy * newLen);
    } else if (mode === 'symmetric') {
        const half = diff / 2;
        pA.x = Math.round(pA.x - ux * half);
        pA.y = Math.round(pA.y - uy * half);
        pB.x = Math.round(pB.x + ux * half);
        pB.y = Math.round(pB.y + uy * half);
    } else {
        // 'chain' mode
        const shiftX = Math.round(ux * diff);
        const shiftY = Math.round(uy * diff);

        if (next === 0) {
            pA.x = Math.round(pB.x - ux * newLen);
            pA.y = Math.round(pB.y - uy * newLen);
        } else {
            for (let k = next; k < n; k++) {
                pts[k].x += shiftX;
                pts[k].y += shiftY;
            }
        }
    }
}

// TEST 1: Chain Shift Prevents Inadvertent Modification of Prior/Downstream Sides
console.log('1. Testing Chain Shift Algorithm:');
const pts = [
    { x: 0, y: 0 },
    { x: 60, y: 0 },
    { x: 60, y: 45 },
    { x: 0, y: 40 }
];

const initialLen0 = dist(pts[0], pts[1]); // 60
const initialLen1 = dist(pts[1], pts[2]); // 45
const initialLen2 = dist(pts[2], pts[3]); // ~60.208
console.log(`Initial lengths: Side0=${initialLen0.toFixed(2)}, Side1=${initialLen1.toFixed(2)}, Side2=${initialLen2.toFixed(2)}`);

// Step 1: User modifies Side 1 (pts[1] -> pts[2]) from 45 to 55
adjustEdgeLength(pts, 1, 2, 55, 'chain');
const afterStep1_Len0 = dist(pts[0], pts[1]);
const afterStep1_Len1 = dist(pts[1], pts[2]);
const afterStep1_Len2 = dist(pts[2], pts[3]);
console.log(`After editing Side 1 to 55: Side0=${afterStep1_Len0.toFixed(2)}, Side1=${afterStep1_Len1.toFixed(2)}, Side2=${afterStep1_Len2.toFixed(2)}`);

assert.strictEqual(afterStep1_Len0, 60, 'Side 0 must stay exactly 60');
assert.strictEqual(Math.round(afterStep1_Len1), 55, 'Side 1 must become 55');
assert.strictEqual(Math.round(afterStep1_Len2), Math.round(initialLen2), 'Side 2 MUST NOT be distorted when Side 1 is edited!');

// Step 2: User modifies Side 2 (pts[2] -> pts[3]) from initialLen2 to 70
adjustEdgeLength(pts, 2, 3, 70, 'chain');
const afterStep2_Len0 = dist(pts[0], pts[1]);
const afterStep2_Len1 = dist(pts[1], pts[2]);
const afterStep2_Len2 = dist(pts[2], pts[3]);
console.log(`After editing Side 2 to 70: Side0=${afterStep2_Len0.toFixed(2)}, Side1=${afterStep2_Len1.toFixed(2)}, Side2=${afterStep2_Len2.toFixed(2)}`);

assert.strictEqual(afterStep2_Len0, 60, 'Side 0 must stay 60 after editing Side 2');
assert.strictEqual(Math.round(afterStep2_Len1), 55, 'Side 1 must stay 55 after editing Side 2');
assert.strictEqual(Math.round(afterStep2_Len2), 70, 'Side 2 must become 70');

console.log('[PASS] Test 1: Prior sides remained 100% stable without unintended length changes!\n');

// TEST 2: AutoCAD Polyline Drawing & Area Accuracy
console.log('2. Testing AutoCAD-style Polyline Draw Simulation:');
const cadPts = [];
// Point 1
cadPts.push({ x: 0, y: 0 });
// Point 2 (30m at 0°)
cadPts.push({ x: 30, y: 0 });
// Point 3 (40m at 90°)
cadPts.push({ x: 30, y: 40 });
// Point 4 (30m at 180°)
cadPts.push({ x: 0, y: 40 });

const area = calculateShoelace(cadPts);
console.log(`Calculated Shoelace Area for 30x40 rectangle: ${area} m²`);
assert.strictEqual(area, 1200, 'Shoelace area must be exactly 1200 m²');

// Test Ortho 90 snapping
const pLast = { x: 10, y: 20 };
// Cursor at (42, 23) -> horizontal movement (dx=32) > vertical (dy=3)
const orthoCursor = { wx: 42, wy: 23 };
if (Math.abs(orthoCursor.wx - pLast.x) >= Math.abs(orthoCursor.wy - pLast.y)) {
    orthoCursor.wy = pLast.y;
} else {
    orthoCursor.wx = pLast.x;
}
assert.strictEqual(orthoCursor.wy, 20, 'Ortho must lock Y to last point Y when dx > dy');
assert.strictEqual(orthoCursor.wx, 42, 'Ortho X stays dynamic');
console.log(`Ortho snapped cursor: (${orthoCursor.wx}, ${orthoCursor.wy})`);
console.log('[PASS] Test 2: AutoCAD polyline drawing and Ortho snapping validated!\n');

console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
