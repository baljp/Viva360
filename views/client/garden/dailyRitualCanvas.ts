import type { MoodType } from '../../../types';

export type DailyRitualShareFormat = 'STORY' | 'POST';

export const DAILY_RITUAL_MOODS: { id: MoodType; label: string; icon: string; color: string }[] = [
  { id: 'SERENO', label: 'Calmo', icon: '😌', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'VIBRANTE', label: 'Feliz', icon: '😄', color: 'bg-amber-100 text-amber-600' },
  { id: 'FOCADO', label: 'Motivado', icon: '⚡', color: 'bg-slate-100 text-slate-600' },
  { id: 'GRATO', label: 'Grato', icon: '💚', color: 'bg-rose-100 text-rose-600' },
  { id: 'MELANCÓLICO', label: 'Triste', icon: '😔', color: 'bg-blue-100 text-blue-600' },
  { id: 'EXAUSTO', label: 'Cansado', icon: '😴', color: 'bg-purple-100 text-purple-600' },
  { id: 'ANSIOSO', label: 'Ansioso', icon: '🌧', color: 'bg-gray-100 text-gray-600' },
];

function getCanvasStyle(currentMood: MoodType) {
  let style = { element: 'Ar', bg: '#f8fafc', color: '#64748b', pattern: 'circle', accent: '#e2e8f0' };

  if (currentMood === 'VIBRANTE' || currentMood === 'FOCADO') {
    style = { element: 'Fogo', bg: '#fffbeb', color: '#f59e0b', pattern: 'rays', accent: '#fcd34d' };
  }
  if (currentMood === 'VIBRANTE') style = { element: 'Fogo', bg: '#fff7ed', color: '#ea580c', pattern: 'rays', accent: '#fdba74' };
  if (currentMood === 'FOCADO') style = { element: 'Fogo', bg: '#fef2f2', color: '#e11d48', pattern: 'rays', accent: '#fda4af' };

  if (currentMood === 'GRATO' || currentMood === 'SERENO') {
    style = { element: 'Terra', bg: '#f0fdf4', color: '#059669', pattern: 'leaf', accent: '#6ee7b7' };
  }
  if (currentMood === 'SERENO') style = { element: 'Terra', bg: '#f6f5f4', color: '#57534e', pattern: 'leaf', accent: '#a8a29e' };

  if (currentMood === 'MELANCÓLICO' || currentMood === 'ANSIOSO' || currentMood === 'EXAUSTO') {
    style = { element: 'Água', bg: '#eff6ff', color: '#2563eb', pattern: 'wave', accent: '#93c5fd' };
  }
  if (currentMood === 'EXAUSTO') style = { element: 'Água', bg: '#faf5ff', color: '#9333ea', pattern: 'wave', accent: '#d8b4fe' };

  return style;
}

export async function drawDailyRitualShareCardCanvas(params: {
  canvas: HTMLCanvasElement;
  imageSrc: string;
  format: DailyRitualShareFormat;
  mood: MoodType;
  intention: string;
}): Promise<string | null> {
  const { canvas, imageSrc, format, mood, intention } = params;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const userImg = new Image();
  userImg.crossOrigin = 'anonymous';
  userImg.src = imageSrc;

  const loaded = await new Promise<boolean>((resolve) => {
    userImg.onload = () => resolve(true);
    userImg.onerror = () => resolve(false);
  });
  if (!loaded) return null;

  const W = 1080;
  const H = format === 'STORY' ? 1920 : 1350;
  canvas.width = W;
  canvas.height = H;

  const style = getCanvasStyle(mood);

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
  const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  drawRoundRect(photoX, photoY, photoW, photoH, 40);
  ctx.clip();

  const coverScale = Math.max(photoW / userImg.width, photoH / userImg.height);
  const coverRx = photoX + (photoW - userImg.width * coverScale) / 2;
  const coverRy = photoY + (photoH - userImg.height * coverScale) / 2;
  const containScale = Math.min(photoW / userImg.width, photoH / userImg.height);
  const containRx = photoX + (photoW - userImg.width * containScale) / 2;
  const containRy = photoY + (photoH - userImg.height * containScale) / 2;

  ctx.filter = 'blur(14px) saturate(1.05) contrast(1.02) brightness(0.9)';
  ctx.drawImage(userImg, coverRx, coverRy, userImg.width * coverScale, userImg.height * coverScale);
  ctx.filter = 'saturate(1.05) contrast(1.02)';
  ctx.drawImage(userImg, containRx, containRy, userImg.width * containScale, userImg.height * containScale);
  ctx.filter = 'none';

  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `${style.color}44`;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  ctx.globalCompositeOperation = 'source-over';
  const gradPhoto = ctx.createLinearGradient(photoX, photoY + photoH * 0.4, photoX, photoY + photoH);
  gradPhoto.addColorStop(0, 'transparent');
  gradPhoto.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = gradPhoto;
  ctx.fillRect(photoX, photoY, photoW, photoH);

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
    gData.data[i + 3] = 12;
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
  ctx.globalAlpha = 0.04;
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.globalAlpha = 1.0;

  const vignette = ctx.createRadialGradient(photoX + photoW / 2, photoY + photoH / 2, 200, photoX + photoW / 2, photoY + photoH / 2, 800);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vignette;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  ctx.restore();

  const quoteAreaY = photoY + photoH + 40;
  const centerX = W / 2;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(photoX + 150, quoteAreaY + 40);
  ctx.lineTo(photoX + photoW - 150, quoteAreaY + 40);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'italic 32px serif';

  const quote = intention || 'Respire. Sinta. Agradeça.';
  const words = quote.split(' ');
  let line = '';
  let lineY = quoteAreaY + 80;
  const lineHeight = 45;

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
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
  ctx.fillText(dateStr, centerX, footerY - 40);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#d4af37';
  (ctx as any).letterSpacing = '8px';
  ctx.fillText('VIVA360 • RITUAL DIÁRIO', centerX, footerY);

  return canvas.toDataURL('image/png');
}
