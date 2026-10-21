/* ==========================================================================
   MISAHA 1+ - BLUEPRINT & EXPORT ENGINE
   Cadastral Blueprints, Live SVG Preview, Hi-Res Canvas & Offline PDF
   ========================================================================== */

function getExportConfig() {
    return {
        style: document.getElementById('expStyle')?.value || 'blueprint',
        pageSize: document.getElementById('expPageSize')?.value || 'a4_land',
        scale: document.getElementById('expScaleRatio')?.value || 'auto',
        showCornerCircles: document.getElementById('expShowCorners')?.checked ?? true,
        showBadgeBoxes: document.getElementById('expShowBadgeBoxes')?.checked ?? true,
        showAngles: document.getElementById('expShowAngles')?.checked ?? true,
        showChords: document.getElementById('expShowChords')?.checked ?? true,
        showEdges: document.getElementById('expShowEdges')?.checked ?? true,
        showGrid: document.getElementById('expShowGrid')?.checked ?? true,
        showSummary: document.getElementById('expShowSummary')?.checked ?? true
    };
}

function openExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('active');
    updateExportOptionsLive();
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('active');
}

function updateExportOptionsLive() {
    const container = document.getElementById('exportLivePreviewContainer');
    if (container) {
        renderBlueprintPreviewSvg(container);
    }
}

// Render SVG Preview inside Export Modal
function renderBlueprintPreviewSvg(container) {
    if (!container) return;
    const pts = Playground.points;
    const n = pts.length;
    if (n < 3) {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:#94a3b8;">يرجى رسم شكل هندسي أولاً</div>';
        return;
    }

    const cfg = getExportConfig();
    const areaM2 = calculateShoelace(pts);
    const perimeterM = calculatePerimeter(pts);
    const decomp = decomposeFeddan(areaM2);
    const isEn = (AppSettings.lang === 'en');
    const uM = isEn ? 'm' : 'م';

    const feddanStr = isEn
        ? `${decomp.feddans} Feddan, ${decomp.qirats} Qirat, ${decomp.sahms} Sahm`
        : `${decomp.feddans} فدان و ${decomp.qirats} قيراط و ${decomp.sahms} سهم`;

    let svgW = 580;
    let svgH = 390;

    // Aspect ratio adjustment based on page size
    if (cfg.pageSize === 'a4_port') {
        svgW = 420;
        svgH = 560;
    } else if (cfg.pageSize === 'square') {
        svgW = 480;
        svgH = 480;
    }

    // Color theme
    let bgFill = '#0a2540';
    let borderStroke = '#38bdf8';
    let polyFill = 'rgba(56, 189, 248, 0.08)';
    let polyStroke = '#ffffff';
    let chordStroke = '#fde047';
    let angleStroke = '#38bdf8';
    let tagBg = '#082f49';
    let tagBorder = '#38bdf8';
    let tagText = '#ffffff';
    let gridColor = 'rgba(255, 255, 255, 0.07)';
    let vertexBg = '#0284c7';
    let vertexText = '#ffffff';

    if (cfg.style === 'cad_dark') {
        bgFill = '#070c18';
        borderStroke = '#10b981';
        polyFill = 'rgba(16, 185, 129, 0.09)';
        polyStroke = '#10b981';
        chordStroke = '#f59e0b';
        angleStroke = '#38bdf8';
        tagBg = '#0f172a';
        tagBorder = '#1e293b';
        tagText = '#a7f3d0';
        gridColor = 'rgba(255, 255, 255, 0.04)';
        vertexBg = '#064e3b';
        vertexText = '#a7f3d0';
    } else if (cfg.style === 'textbook') {
        bgFill = '#ffffff';
        borderStroke = '#0f172a';
        polyFill = 'rgba(0, 0, 0, 0.02)';
        polyStroke = '#0f172a';
        chordStroke = '#b45309';
        angleStroke = '#0369a1';
        tagBg = '#f8fafc';
        tagBorder = '#94a3b8';
        tagText = '#0f172a';
        gridColor = 'rgba(0, 0, 0, 0.05)';
        vertexBg = '#ffffff';
        vertexText = '#0f172a';
    }

    // Bounding Box calculation
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);

    // Dynamic padding: ALWAYS give plenty of space at the top when summary bar is enabled
    // to guarantee ZERO overlap between the banner and the polygon/labels!
    const padTop = cfg.showSummary ? 68 : 42;
    const padBottom = 48;
    const padSide = 48;

    const plotW = svgW - padSide * 2;
    const plotH = svgH - padTop - padBottom;
    const scale = Math.min(plotW / w, plotH / h);
    const offX = padSide + (plotW - w * scale) / 2 - minX * scale;
    const offY = padTop + (plotH - h * scale) / 2 + maxY * scale;

    const normPts = pts.map(p => ({
        x: offX + p.x * scale,
        y: offY - p.y * scale
    }));

    // Grid lines
    let gridLinesHtml = '';
    if (cfg.showGrid) {
        for (let x = 20; x < svgW; x += 30) {
            gridLinesHtml += `<line x1="${x}" y1="0" x2="${x}" y2="${svgH}" stroke="${gridColor}" stroke-width="1"/>`;
        }
        for (let y = 20; y < svgH; y += 30) {
            gridLinesHtml += `<line x1="0" y1="${y}" x2="${svgW}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`;
        }
    }

    const polyStr = normPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // 1. Chords & Diagonals
    let chordsHtml = '';
    if (cfg.showChords && Playground.hasDiagonal && Playground.chords && Playground.chords.length > 0) {
        Playground.chords.forEach((c, idx) => {
            if (c.from < n && c.to < n && c.from !== c.to) {
                const s = normPts[c.from];
                const e = normPts[c.to];
                const dist = Math.round(Math.hypot(pts[c.to].x - pts[c.from].x, pts[c.to].y - pts[c.from].y));
                const chordName = `${getChordName(c.from, c.to)}: ${dist}${uM}`;

                // Stagger chord labels along chord line so multiple chords never collide
                const t = (Playground.chords.length > 1) ? (idx % 2 === 0 ? 0.42 : 0.58) : 0.5;
                const midX = s.x + (e.x - s.x) * t;
                const midY = s.y + (e.y - s.y) * t;

                const tw = chordName.length * 6.5 + 18;

                let chordAngle = Math.atan2(e.y - s.y, e.x - s.x) * 180 / Math.PI;
                if (chordAngle > 90) chordAngle -= 180;
                else if (chordAngle < -90) chordAngle += 180;

                chordsHtml += `
                    <line x1="${s.x}" y1="${s.y}" x2="${e.x}" y2="${e.y}" stroke="${chordStroke}" stroke-width="2" stroke-dasharray="6,4" />
                    <g transform="translate(${midX.toFixed(1)}, ${midY.toFixed(1)}) rotate(${chordAngle.toFixed(1)})">
                        <rect x="${(-tw / 2).toFixed(1)}" y="-11" width="${tw}" height="22" rx="4" fill="${bgFill}" ${cfg.showBadgeBoxes ? `stroke="${chordStroke}" stroke-width="1.2" stroke-dasharray="3,2"` : ''} />
                        <text x="0" y="4" fill="${tagText}" font-size="9" font-weight="800" text-anchor="middle">${chordName}</text>
                    </g>
                `;
            }
        });
    }

    // 2. Corner Angles (Interior placement using geometric bisectors)
    let angleMarkersHtml = '';
    if (cfg.showAngles) {
        normPts.forEach((p, i) => {
            const ang = getCornerAngle(i);
            const bis = getCornerBisectors(normPts, i);

            // Right-angle square indicator
            if (Math.abs(ang - 90) <= 2) {
                const S = 14;
                const u1 = { x: bis.u1.x * S, y: bis.u1.y * S };
                const u2 = { x: bis.u2.x * S, y: bis.u2.y * S };
                const cornerPt = { x: p.x + u1.x + u2.x, y: p.y + u1.y + u2.y };
                angleMarkersHtml += `
                    <path d="M${(p.x + u1.x).toFixed(1)} ${(p.y + u1.y).toFixed(1)} L${cornerPt.x.toFixed(1)} ${cornerPt.y.toFixed(1)} L${(p.x + u2.x).toFixed(1)} ${(p.y + u2.y).toFixed(1)}" fill="none" stroke="${angleStroke}" stroke-width="1.8"/>
                `;
            }

            // Numeric degree text placed along INWARD bisector
            const dist = 28;
            const dX = p.x + bis.inward.x * dist;
            const dY = p.y + bis.inward.y * dist + 3;
            angleMarkersHtml += `
                <text x="${dX.toFixed(1)}" y="${dY.toFixed(1)}" fill="${angleStroke}" font-size="9" font-weight="900" text-anchor="middle" paint-order="stroke" stroke="${bgFill}" stroke-width="3">${ang.toFixed(1)}°</text>
            `;
        });
    }

    // 3. Outer Boundary Edges
    let edgesHtml = '';
    if (cfg.showEdges) {
        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            const pA = normPts[i];
            const pB = normPts[next];
            const midX = (pA.x + pB.x) / 2;
            const midY = (pA.y + pB.y) / 2;
            const dist = Math.round(Math.hypot(pts[next].x - pts[i].x, pts[next].y - pts[i].y));
            const edgeName = `${getEdgeName(i, next)}: ${dist}${uM}`;

            // Perpendicular outward vector
            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const edgeLen = Math.hypot(dx, dy) || 1;
            const isCCW = calculateSignedArea(normPts) >= 0;
            const nx = isCCW ? (dy / edgeLen) : (-dy / edgeLen);
            const ny = isCCW ? (-dx / edgeLen) : (dx / edgeLen);

            const tw = edgeName.length * 6.5 + 20;

            if (cfg.showBadgeBoxes) {
                // If edge is short, offset slightly outward so badge doesn't overlap corner circles
                const offDist = edgeLen < tw + 20 ? 18 : 0;
                const bX = midX + nx * offDist;
                const bY = midY + ny * offDist;

                edgesHtml += `
                    <g>
                        <rect x="${(bX - tw / 2).toFixed(1)}" y="${(bY - 12).toFixed(1)}" width="${tw}" height="24" rx="6" fill="${tagBg}" stroke="${tagBorder}" stroke-width="1.5" />
                        <text x="${bX.toFixed(1)}" y="${(bY + 4).toFixed(1)}" fill="${tagText}" font-size="9.5" font-weight="900" text-anchor="middle">${edgeName}</text>
                    </g>
                `;
            } else {
                const offDist = 16;
                const tX = midX + nx * offDist;
                const tY = midY + ny * offDist + 4;
                edgesHtml += `
                    <text x="${tX.toFixed(1)}" y="${tY.toFixed(1)}" fill="${tagText}" font-size="10.5" font-weight="900" text-anchor="middle" paint-order="stroke" stroke="${bgFill}" stroke-width="3.5">${edgeName}</text>
                `;
            }
        }
    }

    // 4. Vertices (Corner badges with outward offset)
    let verticesHtml = '';
    normPts.forEach((p, idx) => {
        const cName = getCornerName(idx);
        if (cfg.showCornerCircles) {
            verticesHtml += `
                <g>
                    <circle cx="${p.x}" cy="${p.y}" r="13" fill="${vertexBg}" stroke="${polyStroke}" stroke-width="2" />
                    <text x="${p.x}" y="${p.y + 4}" fill="${vertexText}" font-size="10.5" font-weight="900" text-anchor="middle">${cName}</text>
                </g>
            `;
        } else {
            const bis = getCornerBisectors(normPts, idx);
            const offsetDist = 20;
            const lX = p.x + bis.outward.x * offsetDist;
            const lY = p.y + bis.outward.y * offsetDist + 4;
            verticesHtml += `
                <text x="${lX.toFixed(1)}" y="${lY.toFixed(1)}" fill="${polyStroke}" font-size="12" font-weight="900" text-anchor="middle" paint-order="stroke" stroke="${bgFill}" stroke-width="3.5">${cName}</text>
            `;
        }
    });

    // 5. Scale Bar
    const scaleRatio = Math.round(200 / (scale || 1)) * 10 || 200;
    const scaleLabel = cfg.scale !== 'auto' ? cfg.scale : `1:${scaleRatio}`;
    const scaleTxt = `${t('scaleText')}: ${scaleLabel}`;
    const scaleBarHtml = `
        <g transform="translate(24, ${svgH - 26})">
            <rect x="0" y="0" width="30" height="3" fill="${polyStroke}"/>
            <rect x="30" y="0" width="30" height="3" fill="${bgFill}" stroke="${polyStroke}" stroke-width="1"/>
            <text x="0" y="11" font-size="7" fill="${tagText}">0</text>
            <text x="30" y="11" font-size="7" fill="${tagText}">10${uM}</text>
            <text x="60" y="11" font-size="7" fill="${tagText}">20${uM}</text>
            <text x="0" y="-4" font-size="8" font-weight="800" fill="${tagText}">${scaleTxt}</text>
        </g>
    `;

    // 6. Certified Area Summary Banner (Clean, elegant, non-colliding top strip)
    let summaryHtml = '';
    if (cfg.showSummary) {
        summaryHtml = `
            <g transform="translate(14, 14)">
                <rect x="0" y="0" width="${svgW - 28}" height="34" rx="8" fill="${tagBg}" stroke="${borderStroke}" stroke-width="1.2" opacity="0.95"/>
                <text x="${(svgW - 28) / 2}" y="22" font-size="10.5" font-weight="900" fill="${tagText}" text-anchor="middle">
                    ${t('blueprintTitleText')} | ${formatNum(areaM2)} ${isEn ? 'm²' : 'م²'} (${feddanStr}) | ${t('perimeterMTitle')}: ${formatNum(perimeterM, 1)} ${uM}
                </text>
            </g>
        `;
    }

    container.innerHTML = `
        <svg width="100%" height="auto" viewBox="0 0 ${svgW} ${svgH}" style="background:${bgFill}; display:block; border-radius:12px;" preserveAspectRatio="xMidYMid meet">
            <style>
                text { font-family: 'Cairo', 'Tajawal', -apple-system, sans-serif; }
            </style>
            <!-- Background & Border -->
            <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="${bgFill}"/>
            <rect x="8" y="8" width="${svgW - 16}" height="${svgH - 16}" fill="none" stroke="${borderStroke}" stroke-width="1.8"/>
            ${gridLinesHtml}
            <!-- Parcel Polygon -->
            <polygon points="${polyStr}" fill="${polyFill}" stroke="${polyStroke}" stroke-width="3" stroke-linejoin="round"/>
            ${chordsHtml}
            ${angleMarkersHtml}
            ${edgesHtml}
            ${verticesHtml}
            ${scaleBarHtml}
            ${summaryHtml}
        </svg>
    `;
}

// Render 300 DPI Canvas for PDF / PNG export
function renderClassicBlueprintCanvas(width, height) {
    const pts = Playground.points;
    const n = pts.length;
    const cfg = getExportConfig();

    const areaM2 = calculateShoelace(pts);
    const perimeterM = calculatePerimeter(pts);
    const decomp = decomposeFeddan(areaM2);
    const isEn = (AppSettings.lang === 'en');
    const uM = isEn ? 'm' : 'م';

    const feddanStr = isEn
        ? `${decomp.feddans} Feddan, ${decomp.qirats} Qirat, ${decomp.sahms} Sahm`
        : `${decomp.feddans} فدان و ${decomp.qirats} قيراط و ${decomp.sahms} سهم`;

    const cvs = document.createElement('canvas');
    cvs.width = width;
    cvs.height = height;
    const ctx = cvs.getContext('2d');

    // Theme Colors
    let bgFill = '#0a2540';
    let borderStroke = '#38bdf8';
    let polyFill = 'rgba(56, 189, 248, 0.08)';
    let polyStroke = '#ffffff';
    let chordStroke = '#fde047';
    let angleStroke = '#38bdf8';
    let tagBg = '#082f49';
    let tagBorder = '#38bdf8';
    let tagText = '#ffffff';
    let gridColor = 'rgba(255, 255, 255, 0.07)';
    let vertexBg = '#0284c7';
    let vertexText = '#ffffff';

    if (cfg.style === 'cad_dark') {
        bgFill = '#070c18';
        borderStroke = '#10b981';
        polyFill = 'rgba(16, 185, 129, 0.09)';
        polyStroke = '#10b981';
        chordStroke = '#f59e0b';
        angleStroke = '#38bdf8';
        tagBg = '#0f172a';
        tagBorder = '#1e293b';
        tagText = '#a7f3d0';
        gridColor = 'rgba(255, 255, 255, 0.04)';
        vertexBg = '#064e3b';
        vertexText = '#a7f3d0';
    } else if (cfg.style === 'textbook') {
        bgFill = '#ffffff';
        borderStroke = '#0f172a';
        polyFill = 'rgba(0, 0, 0, 0.02)';
        polyStroke = '#0f172a';
        chordStroke = '#b45309';
        angleStroke = '#0369a1';
        tagBg = '#f8fafc';
        tagBorder = '#94a3b8';
        tagText = '#0f172a';
        gridColor = 'rgba(0, 0, 0, 0.05)';
        vertexBg = '#ffffff';
        vertexText = '#0f172a';
    }

    // Fill background
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, width, height);

    // Frame border
    ctx.lineWidth = 4;
    ctx.strokeStyle = borderStroke;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Grid
    if (cfg.showGrid) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = gridColor;
        for (let x = 60; x < width - 60; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 28);
            ctx.lineTo(x, height - 28);
            ctx.stroke();
        }
        for (let y = 60; y < height - 60; y += 60) {
            ctx.beginPath();
            ctx.moveTo(28, y);
            ctx.lineTo(width - 28, y);
            ctx.stroke();
        }
    }

    // Bounds & Scale
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const padTop = cfg.showSummary ? 220 : 180;
    const padBottom = 180;
    const padSide = 220;
    const plotW = width - padSide * 2;
    const plotH = height - padTop - padBottom;
    const scale = Math.min(plotW / w, plotH / h);
    const offX = padSide + (plotW - w * scale) / 2 - minX * scale;
    const offY = padTop + (plotH - h * scale) / 2 + maxY * scale;

    const normPts = pts.map(p => ({
        x: offX + p.x * scale,
        y: offY - p.y * scale
    }));

    // Draw Polygon
    ctx.beginPath();
    normPts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = polyFill;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = polyStroke;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 1. Chords
    if (cfg.showChords && Playground.hasDiagonal && Playground.chords && Playground.chords.length > 0) {
        ctx.setLineDash([14, 8]);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = chordStroke;

        Playground.chords.forEach((c, idx) => {
            if (c.from < n && c.to < n && c.from !== c.to) {
                const s = normPts[c.from];
                const e = normPts[c.to];
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(e.x, e.y);
                ctx.stroke();

                const dist = Math.round(Math.hypot(pts[c.to].x - pts[c.from].x, pts[c.to].y - pts[c.from].y));
                const text = `${getChordName(c.from, c.to)}: ${dist}${uM}`;
                const t = (Playground.chords.length > 1) ? (idx % 2 === 0 ? 0.42 : 0.58) : 0.5;
                const midX = s.x + (e.x - s.x) * t;
                const midY = s.y + (e.y - s.y) * t;

                let chordAngle = Math.atan2(e.y - s.y, e.x - s.x);
                if (chordAngle > Math.PI / 2) chordAngle -= Math.PI;
                else if (chordAngle < -Math.PI / 2) chordAngle += Math.PI;

                ctx.font = 'bold 22px "Cairo", "Tajawal", sans-serif';
                const tw = ctx.measureText(text).width + 32;

                ctx.save();
                ctx.translate(midX, midY);
                ctx.rotate(chordAngle);

                // Opaque mask wipes out the dashed chord line underneath the text to guarantee ZERO collision
                ctx.fillStyle = bgFill;
                ctx.fillRect(-tw / 2, -20, tw, 40);

                if (cfg.showBadgeBoxes) {
                    ctx.strokeStyle = chordStroke;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-tw / 2, -20, tw, 40);
                }

                ctx.fillStyle = tagText;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 0, 0);
                ctx.restore();
            }
        });
        ctx.setLineDash([]);
    }

    // 2. Angles
    if (cfg.showAngles) {
        normPts.forEach((p, i) => {
            const ang = getCornerAngle(i);
            const bis = getCornerBisectors(normPts, i);

            if (Math.abs(ang - 90) <= 2) {
                const S = 30;
                const u1 = { x: bis.u1.x * S, y: bis.u1.y * S };
                const u2 = { x: bis.u2.x * S, y: bis.u2.y * S };
                const cornerPt = { x: p.x + u1.x + u2.x, y: p.y + u1.y + u2.y };
                ctx.beginPath();
                ctx.moveTo(p.x + u1.x, p.y + u1.y);
                ctx.lineTo(cornerPt.x, cornerPt.y);
                ctx.lineTo(p.x + u2.x, p.y + u2.y);
                ctx.strokeStyle = angleStroke;
                ctx.lineWidth = 3.5;
                ctx.stroke();
            }

            const dist = 55;
            const dX = p.x + bis.inward.x * dist;
            const dY = p.y + bis.inward.y * dist;
            ctx.font = 'bold 22px "Cairo", "Tajawal", sans-serif';
            ctx.fillStyle = angleStroke;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${ang.toFixed(1)}°`, dX, dY);
        });
    }

    // 3. Outer Boundary Edges
    if (cfg.showEdges) {
        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            const pA = normPts[i];
            const pB = normPts[next];
            const midX = (pA.x + pB.x) / 2;
            const midY = (pA.y + pB.y) / 2;
            const dist = Math.round(Math.hypot(pts[next].x - pts[i].x, pts[next].y - pts[i].y));
            const text = `${getEdgeName(i, next)}: ${dist}${uM}`;

            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const edgeLen = Math.hypot(dx, dy) || 1;
            const isCCW = calculateSignedArea(normPts) < 0;
            const nx = isCCW ? (-dy / edgeLen) : (dy / edgeLen);
            const ny = isCCW ? (dx / edgeLen) : (-dx / edgeLen);

            let edgeAngle = Math.atan2(dy, dx);
            if (edgeAngle > Math.PI / 2) edgeAngle -= Math.PI;
            else if (edgeAngle < -Math.PI / 2) edgeAngle += Math.PI;

            ctx.font = 'bold 24px "Cairo", "Tajawal", sans-serif';
            const tw = ctx.measureText(text).width + 36;

            const offDist = cfg.showBadgeBoxes ? 32 : 26;
            const tX = midX + nx * offDist;
            const tY = midY + ny * offDist;

            ctx.save();
            ctx.translate(tX, tY);
            ctx.rotate(edgeAngle);

            if (cfg.showBadgeBoxes) {
                ctx.fillStyle = tagBg;
                ctx.fillRect(-tw / 2, -22, tw, 44);
                ctx.strokeStyle = tagBorder;
                ctx.lineWidth = 2.5;
                ctx.strokeRect(-tw / 2, -22, tw, 44);
                ctx.fillStyle = tagText;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 0, 0);
            } else {
                ctx.strokeStyle = bgFill;
                ctx.lineWidth = 8;
                ctx.lineJoin = 'round';
                ctx.strokeText(text, 0, 0);
                ctx.fillStyle = tagText;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 0, 0);
            }
            ctx.restore();
        }
    }

    // 4. Vertices
    normPts.forEach((p, idx) => {
        const cName = getCornerName(idx);
        if (cfg.showCornerCircles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
            ctx.fillStyle = vertexBg;
            ctx.fill();
            ctx.strokeStyle = polyStroke;
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.font = 'bold 24px "Cairo", "Tajawal", sans-serif';
            ctx.fillStyle = vertexText;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cName, p.x, p.y);
        } else {
            const bis = getCornerBisectors(normPts, idx);
            const offsetDist = 44;
            const lX = p.x + bis.outward.x * offsetDist;
            const lY = p.y + bis.outward.y * offsetDist;

            ctx.font = 'bold 28px "Cairo", "Tajawal", sans-serif';
            ctx.fillStyle = polyStroke;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cName, lX, lY);
        }
    });

    // 5. Scale Bar
    const scaleRatio = Math.round(200 / (scale || 1)) * 10 || 200;
    const scaleLabel = cfg.scale !== 'auto' ? cfg.scale : `1:${scaleRatio}`;
    const scaleTextCanvas = `${t('scaleText')}: ${scaleLabel}`;
    ctx.fillStyle = polyStroke;
    ctx.fillRect(60, height - 70, 70, 6);
    ctx.strokeRect(130, height - 70, 70, 6);
    ctx.font = '18px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = tagText;
    ctx.textAlign = 'left';
    ctx.fillText(`0    10${uM}    20${uM}  |  ${scaleTextCanvas}`, 60, height - 85);

    // 6. Summary Strip
    if (cfg.showSummary) {
        ctx.fillStyle = tagBg;
        ctx.fillRect(50, 48, width - 100, 68);
        ctx.strokeStyle = borderStroke;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(50, 48, width - 100, 68);

        ctx.font = 'bold 24px "Cairo", "Tajawal", sans-serif';
        ctx.fillStyle = tagText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const summaryText = `${t('blueprintTitleText')} | ${formatNum(areaM2)} ${isEn ? 'm²' : 'م²'} (${feddanStr}) | ${t('perimeterMTitle')}: ${formatNum(perimeterM, 1)} ${uM}`;
        ctx.fillText(summaryText, width / 2, 82);
    }

    return cvs;
}

// Save Direct PDF
function downloadClassicPDF() {
    try {
        const cfg = getExportConfig();
        let w = 1754;
        let h = 1240;
        let pdfPageW = 842;
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
        canvas.width = 1;
        canvas.height = 1;

        const base64Data = jpegDataUrl.split(',')[1];
        const binaryStr = atob(base64Data);
        const imgBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            imgBytes[i] = binaryStr.charCodeAt(i);
        }

        const pdfBytes = generateSinglePagePdfWithJpeg(imgBytes, w, h, pdfPageW, pdfPageH, t('blueprintTitleText'));
        const filename = `misaha_blueprint_${Date.now()}.pdf`;

        const ok = saveOrDownloadFile(pdfBytes, filename, 'application/pdf');
        if (ok) {
            showToast(t('toastPdfSuccess'), 'success');
        } else {
            showToast(t('toastPdfError'), 'error');
        }
    } catch (err) {
        console.error('PDF export error:', err);
        showToast(t('toastPdfError'), 'error');
    }
}

// Save Hi-Res PNG
function downloadClassicPNG() {
    try {
        const cfg = getExportConfig();
        let w = 1920;
        let h = 1080;
        if (cfg.pageSize === 'a4_land') { w = 1754; h = 1240; }
        else if (cfg.pageSize === 'a4_port') { w = 1240; h = 1754; }
        else if (cfg.pageSize === 'square') { w = 1400; h = 1400; }

        const canvas = renderClassicBlueprintCanvas(w, h);
        const pngDataUrl = canvas.toDataURL('image/png');
        canvas.width = 1;
        canvas.height = 1;
        const base64 = pngDataUrl.split(',')[1];
        const binaryStr = atob(base64);
        const pngBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            pngBytes[i] = binaryStr.charCodeAt(i);
        }

        const filename = `misaha_blueprint_${Date.now()}.png`;
        const ok = saveOrDownloadFile(pngBytes, filename, 'image/png');
        if (ok) {
            showToast(t('toastPngSuccess'), 'success');
        } else {
            showToast(t('toastPngError'), 'error');
        }
    } catch (err) {
        console.error('PNG export error:', err);
        showToast(t('toastPngError'), 'error');
    }
}
