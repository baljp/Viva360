import { MOOD_ELEMENTS } from '../../src/data/metamorphosisData';

export type MetamorphosisShareFormat = 'STORY' | 'POST';

export async function drawMetamorphosisCardCanvas(params: {
  canvas: HTMLCanvasElement;
  format: MetamorphosisShareFormat;
  photoThumb?: string | null;
  mood: string;
  quote: string;
  timestamp: string;
}): Promise<string | null> {
  const { canvas, format, photoThumb, mood, quote, timestamp } = params;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const W = 1080;
  const H = format === 'STORY' ? 1920 : 1350;
  canvas.width = W;
  canvas.height = H;

  const resolvedQuote = String(quote || '').trim();
  const resolvedTimestamp = timestamp || new Date().toISOString();

  const renderFallback = () => {
    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'italic 44px serif';
    ctx.fillText(resolvedQuote, W / 2, H / 2 - 120, W - 160);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('VIVA360 • ESSÊNCIA & EVOLUÇÃO', W / 2, H - 120);
    return canvas.toDataURL('image/png');
  };

  if (!photoThumb) return renderFallback();

  const userImg = new Image();
  userImg.crossOrigin = 'anonymous';
  userImg.src = photoThumb;
  const loaded = await new Promise<boolean>((resolve) => {
    userImg.onload = () => resolve(true);
    userImg.onerror = () => resolve(false);
  });
  if (!loaded) return renderFallback();

  const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const styling = MOOD_ELEMENTS[mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
  const elementColor = styling.color.includes('rose') ? '#f43f5e'
    : styling.color.includes('cyan') ? '#06b6d4'
    : styling.color.includes('emerald') ? '#10b981'
    : styling.color.includes('indigo') ? '#6366f1' : '#f59e0b';

  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(0.5, '#111827');
  bgGradient.addColorStop(1, '#020617');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.globalAlpha = 1.0;

  const photoW = format === 'STORY' ? 900 : 1000;
  const photoH = format === 'STORY' ? 1200 : 800;
  const photoX = (W - photoW) / 2;
  const photoY = format === 'STORY' ? 250 : 200;

  ctx.save();
  drawRoundRect(photoX, photoY, photoW, photoH, 40);
  ctx.clip();

  const coverScale = Math.max(photoW / userImg.width, photoH / userImg.height);
  const coverRx = photoX + (photoW - userImg.width * coverScale) / 2;
  const coverRy = photoY + (photoH - userImg.height * coverScale) / 2;
  const containScale = Math.min(photoW / userImg.width, photoH / userImg.height);
  const containRx = photoX + (photoW - userImg.width * containScale) / 2;
  const containRy = photoY + (photoH - userImg.height * containScale) / 2;
  ctx.filter = 'blur(14px) brightness(0.92) contrast(1.05) saturate(1.02)';
  ctx.drawImage(userImg, coverRx, coverRy, userImg.width * coverScale, userImg.height * coverScale);
  ctx.filter = 'brightness(1.05) contrast(1.1) saturate(1.1)';
  ctx.drawImage(userImg, containRx, containRy, userImg.width * containScale, userImg.height * containScale);
  ctx.filter = 'none';

  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `${elementColor}33`;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  ctx.globalCompositeOperation = 'multiply';
  const vignette = ctx.createRadialGradient(photoX + photoW / 2, photoY + photoH / 2, 200, photoX + photoW / 2, photoY + photoH / 2, 800);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.globalCompositeOperation = 'source-over';

  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 128;
  grainCanvas.height = 128;
  const gCtx = grainCanvas.getContext('2d')!;
  const gData = gCtx.createImageData(128, 128);
  for (let i = 0; i < gData.data.length; i += 4) {
    const val = Math.random() * 255;
    gData.data[i] = val;
    gData.data[i + 1] = val;
    gData.data[i + 2] = val;
    gData.data[i + 3] = 10;
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
  ctx.globalAlpha = 0.03;
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.globalAlpha = 1.0;
  ctx.restore();

  const quoteAreaY = photoY + photoH + 40;
  const centerX = W / 2;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(photoX + 100, quoteAreaY);
  ctx.lineTo(photoX + photoW - 100, quoteAreaY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'italic 48px serif';

  const words = resolvedQuote.split(/\s+/).filter(Boolean);
  let line = '';
  let lineY = quoteAreaY + 60;
  const lineHeight = 65;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > (photoW - 150) && n > 0) {
      ctx.fillText(line.trim(), centerX, lineY);
      line = words[n] + ' ';
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), centerX, lineY);

  const footerY = H - 120;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  (ctx as any).letterSpacing = '4px';
  const dateStr = new Date(resolvedTimestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
  ctx.fillText(dateStr, centerX, footerY - 40);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#d4af37';
  (ctx as any).letterSpacing = '8px';
  ctx.fillText('VIVA360 • ESSÊNCIA & EVOLUÇÃO', centerX, footerY);

  return canvas.toDataURL('image/png');
}
