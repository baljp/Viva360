
/**
 * Advanced Sharing Utility for Viva360
 * Generates high-quality, non-distorted canvas images for IG Stories or WhatsApp.
 */

export type SharePlatform = 'generic' | 'whatsapp' | 'instagram';
export type ShareFormat = 'story' | 'feed';

export interface ShareContent {
    title: string;
    subtitle?: string;
    message: string;
    imageUrl?: string;
    footer?: string;
    accentColor?: string;
    date?: string;
    format?: ShareFormat;
    mimeType?: 'image/jpeg' | 'image/png';
}

export interface ShareRequest {
    title?: string;
    text: string;
    url?: string;
    filename?: string;
    platform?: SharePlatform;
}

export const generateShareCanvas = async (content: ShareContent): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const format: ShareFormat = content.format || 'story';
    const target = format === 'feed'
        ? { width: 1080, height: 1350 }
        : { width: 1080, height: 1920 };

    canvas.width = target.width;
    canvas.height = target.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Background (Deep Gradient)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0f172a'); // slate-900
    grad.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Load and Draw Main Image (Protagonist)
    if (content.imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = content.imageUrl;

        await new Promise((resolve) => {
            img.onload = () => {
                // Cover behavior (no distortion)
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                
                // Draw with subtle opacity to allow gradient to bleed
                ctx.globalAlpha = 0.8;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                ctx.globalAlpha = 1.0;
                resolve(null);
            };
            img.onerror = () => resolve(null);
        });
    }

    // 3. Atmospheric Overlays
    // Bottom Vignette
    const vignette = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
    vignette.addColorStop(0.8, 'rgba(2, 6, 23, 0.9)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 1)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

    // 4. Content Rendering
    ctx.textAlign = 'center';
    
    // Header (Title & Subtitle)
    if (content.subtitle) {
        ctx.fillStyle = content.accentColor || '#6366f1'; // indigo-500
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(content.subtitle.toUpperCase(), canvas.width / 2, 200);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = format === 'feed' ? 'italic 58px serif' : 'italic 70px serif';
    ctx.fillText(content.title, canvas.width / 2, format === 'feed' ? 280 : 300);

    // Message (Quote Box)
    const padding = format === 'feed' ? 86 : 100;
    const maxWidth = canvas.width - (padding * 2);
    ctx.font = format === 'feed' ? 'italic 46px serif' : 'italic 54px serif';
    const words = content.message.split(' ');
    let line = '';
    const lines = [];
    
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Center Message Vertically (Bottom third)
    const startY = canvas.height * (format === 'feed' ? 0.7 : 0.75) - (lines.length * 40);
    
    // Draw Quote Background (Glass effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const boxHeight = lines.length * (format === 'feed' ? 70 : 80) + 100;
    // @ts-ignore - roundRect is modern
    if (ctx.roundRect) {
        ctx.roundRect(padding - 40, startY - 80, canvas.width - (padding-40)*2, boxHeight, 40);
    } else {
        ctx.rect(padding - 40, startY - 80, canvas.width - (padding-40)*2, boxHeight);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    lines.forEach((l, i) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + (i * 80));
    });

    // 5. Footer (Branding)
    ctx.font = format === 'feed' ? 'bold 34px sans-serif' : 'bold 40px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(content.footer || 'VIVA360', canvas.width / 2, canvas.height - (format === 'feed' ? 120 : 150));

    if (content.date) {
        ctx.font = format === 'feed' ? '24px sans-serif' : '30px sans-serif';
        ctx.fillText(content.date, canvas.width / 2, canvas.height - (format === 'feed' ? 78 : 100));
    }

    const mimeType = content.mimeType || 'image/jpeg';
    const quality = mimeType === 'image/jpeg' ? 0.96 : 1.0;
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
};

const buildShareRequest = (input: string | ShareRequest, fallbackFilename: string): ShareRequest => {
    if (typeof input === 'string') {
        return {
            text: input,
            title: 'Viva360',
            filename: fallbackFilename,
            platform: 'generic',
        };
    }

    return {
        title: input.title || 'Viva360',
        text: input.text,
        url: input.url,
        filename: input.filename || fallbackFilename,
        platform: input.platform || 'generic',
    };
};

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

export const shareToSocial = async (blob: Blob, input: string | ShareRequest, fallbackFilename: string = 'viva360-share.jpg') => {
    const req = buildShareRequest(input, fallbackFilename);
    const file = new File([blob], req.filename || fallbackFilename, { type: blob.type || 'image/jpeg' });
    const text = req.url ? `${req.text}\n\n${req.url}` : req.text;
    const sharePayload = {
        title: req.title || 'Viva360',
        text,
        files: [file],
        ...(req.url ? { url: req.url } : {}),
    };

    const canNativeShare = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
    if (canNativeShare) {
        try {
            await navigator.share(sharePayload);
            return true;
        } catch (error) {
            console.error('WebShare failed', error);
        }
    }

    if (req.platform === 'whatsapp') {
        try {
            const waText = encodeURIComponent(text);
            window.open(`https://wa.me/?text=${waText}`, '_blank', 'noopener,noreferrer');
            downloadBlob(blob, req.filename || fallbackFilename);
            return true;
        } catch {
            // fallback below
        }
    }

    if (req.platform === 'instagram') {
        // Instagram web has no direct public API for file upload: best fallback is download with native naming.
        downloadBlob(blob, req.filename || fallbackFilename);
        return false;
    }

    downloadBlob(blob, req.filename || fallbackFilename);
    return false;
};
