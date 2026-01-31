
/**
 * Advanced Sharing Utility for Viva360
 * Generates high-quality, non-distorted canvas images for IG Stories or WhatsApp.
 */

export interface ShareContent {
    title: string;
    subtitle?: string;
    message: string;
    imageUrl?: string;
    footer?: string;
    accentColor?: string;
    date?: string;
}

export const generateShareCanvas = async (content: ShareContent): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // IG Stories Aspect Ratio (9:16)
    canvas.width = 1080;
    canvas.height = 1920;

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
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(content.subtitle.toUpperCase(), canvas.width / 2, 200);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 70px serif';
    ctx.fillText(content.title, canvas.width / 2, 300);

    // Message (Quote Box)
    const padding = 100;
    const maxWidth = canvas.width - (padding * 2);
    ctx.font = 'italic 54px serif';
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
    const startY = canvas.height * 0.75 - (lines.length * 40);
    
    // Draw Quote Background (Glass effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const boxHeight = lines.length * 80 + 100;
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
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(content.footer || 'VIVA360', canvas.width / 2, canvas.height - 150);

    if (content.date) {
        ctx.font = '30px sans-serif';
        ctx.fillText(content.date, canvas.width / 2, canvas.height - 100);
    }

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
};

export const shareToSocial = async (blob: Blob, text: string, filename: string = 'viva360-share.png') => {
    const file = new File([blob], filename, { type: 'image/png' });
    const shareData = {
        title: 'Viva360',
        text: text,
        files: [file]
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            return true;
        } catch (e) {
            console.error("WebShare failed", e);
        }
    }
    
    // Fallback: Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return false;
};
