/* ==========================================================================
   MISAHA 1+ - OFFLINE PDF & FILE EXPORT ENGINE
   Zero-dependency PDF 1.4 generator & AndroidBridge native save integration
   ========================================================================== */

function generateSinglePagePdfWithJpeg(jpegBytes, width, height, pageW = 842, pageH = 595, title = 'Misaha Cadastral Blueprint') {
    const margin = 24;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / width, maxH / height);
    const drawW = Math.round(width * scale);
    const drawH = Math.round(height * scale);
    const drawX = Math.round((pageW - drawW) / 2);
    const drawY = Math.round((pageH - drawH) / 2);

    const header = '%PDF-1.4\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
    
    const obj4Head = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
    const obj4Tail = '\nendstream\nendobj\n';

    const contentStr = `q ${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm /Im0 Do Q`;
    const obj5 = `5 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}\nendstream\nendobj\n`;
    const obj6 = `6 0 obj\n<< /Title (${title}) /Creator (Misaha 1+ Cadastral Survey) >>\nendobj\n`;

    const offsets = [0];
    let offset = header.length;
    offsets.push(offset); offset += obj1.length;
    offsets.push(offset); offset += obj2.length;
    offsets.push(offset); offset += obj3.length;
    offsets.push(offset); offset += obj4Head.length + jpegBytes.length + obj4Tail.length;
    offsets.push(offset); offset += obj5.length;
    offsets.push(offset); offset += obj6.length;

    let xref = 'xref\n0 7\n0000000000 65535 f \n';
    for (let i = 1; i <= 6; i++) {
        xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    const trailer = `trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

    const enc = new TextEncoder();
    const bHeader = enc.encode(header);
    const bObj1 = enc.encode(obj1);
    const bObj2 = enc.encode(obj2);
    const bObj3 = enc.encode(obj3);
    const bObj4Head = enc.encode(obj4Head);
    const bObj4Tail = enc.encode(obj4Tail);
    const bObj5 = enc.encode(obj5);
    const bObj6 = enc.encode(obj6);
    const bXref = enc.encode(xref);
    const bTrailer = enc.encode(trailer);

    const totalLength = bHeader.length + bObj1.length + bObj2.length + bObj3.length +
                        bObj4Head.length + jpegBytes.length + bObj4Tail.length +
                        bObj5.length + bObj6.length + bXref.length + bTrailer.length;

    const pdf = new Uint8Array(totalLength);
    let pos = 0;
    const append = (buf) => { pdf.set(buf, pos); pos += buf.length; };

    append(bHeader);
    append(bObj1);
    append(bObj2);
    append(bObj3);
    append(bObj4Head);
    append(jpegBytes);
    append(bObj4Tail);
    append(bObj5);
    append(bObj6);
    append(bXref);
    append(bTrailer);

    return pdf;
}

// Save or Download File (PDF or PNG) with native Android bridge support
function saveOrDownloadFile(bytes, filename, mimeType) {
    // 1. Check if running inside Android WebView with native AndroidBridge
    if (window.AndroidBridge && typeof window.AndroidBridge.saveBase64File === 'function') {
        try {
            let binary = '';
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            window.AndroidBridge.saveBase64File(base64, filename, mimeType);
            return true;
        } catch (err) {
            console.warn('AndroidBridge call failed, falling back to standard download:', err);
        }
    }

    // 2. Standard Browser Blob Download
    try {
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2500);
        return true;
    } catch (err) {
        console.error('Blob download failed:', err);
        // Fallback for environments with strict blob policies
        try {
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const dataUri = `data:${mimeType};base64,${btoa(binary)}`;
            const link = document.createElement('a');
            link.href = dataUri;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (e2) {
            console.error('DataURI fallback failed:', e2);
            return false;
        }
    }
}

// Trigger system print dialog (works in mobile browsers and WebViews supporting print)
function triggerSystemPrint() {
    try {
        if (window.AndroidBridge && typeof window.AndroidBridge.printPdf === 'function') {
            window.AndroidBridge.printPdf();
            return;
        }
        window.print();
    } catch (err) {
        console.warn('System print failed:', err);
    }
}
