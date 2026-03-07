import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Camera, CheckCircle2, ImageIcon, Sparkles, X } from 'lucide-react';
import { captureFrontendError } from '../../lib/frontendLogger';
import { useAppToast } from '../../src/contexts/AppToastContext';

export type CameraCaptureResult = {
  fullBlob: Blob;
  thumbDataUrl: string;
  width: number;
  height: number;
};

type CameraVariant = 'POST' | 'STORY' | 'SQUARE';
export type CameraEffectKey =
  | 'default'
  | 'serene'
  | 'grateful'
  | 'vibrant'
  | 'focused'
  | 'anxious'
  | 'melancholic'
  | 'restorative'
  | 'joyful'
  | 'calm'
  | 'motivated'
  | 'tired'
  | 'sad'
  | 'overwhelmed';

type CameraEffectPreset = {
  key: CameraEffectKey;
  badge: string;
  caption: string;
  videoFilter: string;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  chipClassName: string;
  overlayBlend: string;
  grainOpacity: number;
};

const CAMERA_EFFECT_PRESETS: Record<CameraEffectKey, CameraEffectPreset> = {
  default: {
    key: 'default',
    badge: 'Neutro',
    caption: 'Luz limpa e acolhedora para auto-observação.',
    videoFilter: 'contrast(1.02) saturate(1.05) brightness(1.01)',
    accentFrom: 'rgba(255,255,255,0.16)',
    accentTo: 'rgba(12,18,18,0.26)',
    borderColor: 'rgba(255,255,255,0.28)',
    chipClassName: 'border-white/20 bg-white/10 text-white/90',
    overlayBlend: 'rgba(255,255,255,0.04)',
    grainOpacity: 0.035,
  },
  serene: {
    key: 'serene',
    badge: 'Sereno',
    caption: 'Verde pedra e névoa suave para presença estável.',
    videoFilter: 'contrast(1.01) saturate(0.94) brightness(1.03) hue-rotate(-6deg)',
    accentFrom: 'rgba(173, 223, 198, 0.24)',
    accentTo: 'rgba(13, 25, 22, 0.30)',
    borderColor: 'rgba(190,240,214,0.34)',
    chipClassName: 'border-emerald-200/30 bg-emerald-100/10 text-emerald-50',
    overlayBlend: 'rgba(120, 197, 164, 0.10)',
    grainOpacity: 0.03,
  },
  grateful: {
    key: 'grateful',
    badge: 'Gratidão',
    caption: 'Quente e orgânico, com brilho dourado discreto.',
    videoFilter: 'contrast(1.04) saturate(1.02) brightness(1.04) sepia(0.08)',
    accentFrom: 'rgba(250, 216, 145, 0.24)',
    accentTo: 'rgba(37, 24, 10, 0.26)',
    borderColor: 'rgba(255,227,179,0.34)',
    chipClassName: 'border-amber-200/30 bg-amber-100/10 text-amber-50',
    overlayBlend: 'rgba(255, 191, 89, 0.10)',
    grainOpacity: 0.028,
  },
  vibrant: {
    key: 'vibrant',
    badge: 'Vibrante',
    caption: 'Energia viva com calor sutil e contraste alto.',
    videoFilter: 'contrast(1.08) saturate(1.14) brightness(1.04)',
    accentFrom: 'rgba(255, 175, 108, 0.20)',
    accentTo: 'rgba(65, 18, 18, 0.26)',
    borderColor: 'rgba(255,209,163,0.34)',
    chipClassName: 'border-orange-200/30 bg-orange-100/10 text-orange-50',
    overlayBlend: 'rgba(255, 124, 72, 0.10)',
    grainOpacity: 0.04,
  },
  focused: {
    key: 'focused',
    badge: 'Focado',
    caption: 'Nitidez elegante com vermelho mineral contido.',
    videoFilter: 'contrast(1.08) saturate(1.00) brightness(1.01)',
    accentFrom: 'rgba(249, 168, 212, 0.16)',
    accentTo: 'rgba(40, 15, 25, 0.30)',
    borderColor: 'rgba(253,205,231,0.36)',
    chipClassName: 'border-rose-200/30 bg-rose-100/10 text-rose-50',
    overlayBlend: 'rgba(255, 96, 160, 0.08)',
    grainOpacity: 0.03,
  },
  anxious: {
    key: 'anxious',
    badge: 'Ansioso',
    caption: 'Frio leve e ar de pausa, sem dramatização.',
    videoFilter: 'contrast(1.03) saturate(0.92) brightness(1.01) hue-rotate(4deg)',
    accentFrom: 'rgba(157, 180, 255, 0.18)',
    accentTo: 'rgba(11, 16, 35, 0.30)',
    borderColor: 'rgba(198,210,255,0.34)',
    chipClassName: 'border-indigo-200/30 bg-indigo-100/10 text-indigo-50',
    overlayBlend: 'rgba(111, 138, 255, 0.08)',
    grainOpacity: 0.03,
  },
  melancholic: {
    key: 'melancholic',
    badge: 'Melancolia',
    caption: 'Azul suave e acolhimento de profundidade.',
    videoFilter: 'contrast(1.01) saturate(0.90) brightness(0.98) hue-rotate(6deg)',
    accentFrom: 'rgba(140, 178, 255, 0.20)',
    accentTo: 'rgba(7, 18, 28, 0.32)',
    borderColor: 'rgba(190,214,255,0.32)',
    chipClassName: 'border-blue-200/30 bg-blue-100/10 text-blue-50',
    overlayBlend: 'rgba(92, 155, 255, 0.08)',
    grainOpacity: 0.028,
  },
  restorative: {
    key: 'restorative',
    badge: 'Restauração',
    caption: 'Lavanda sutil e respiração visual desacelerada.',
    videoFilter: 'contrast(0.99) saturate(0.90) brightness(1.02) hue-rotate(-4deg)',
    accentFrom: 'rgba(200, 180, 255, 0.18)',
    accentTo: 'rgba(26, 18, 36, 0.28)',
    borderColor: 'rgba(219,205,255,0.30)',
    chipClassName: 'border-violet-200/30 bg-violet-100/10 text-violet-50',
    overlayBlend: 'rgba(158, 124, 255, 0.08)',
    grainOpacity: 0.025,
  },
  joyful: {
    key: 'joyful',
    badge: 'Feliz',
    caption: 'Calor dourado claro e presença expansiva.',
    videoFilter: 'contrast(1.06) saturate(1.12) brightness(1.05)',
    accentFrom: 'rgba(255, 219, 116, 0.24)',
    accentTo: 'rgba(58, 22, 6, 0.24)',
    borderColor: 'rgba(255,229,165,0.35)',
    chipClassName: 'border-amber-200/30 bg-amber-100/10 text-amber-50',
    overlayBlend: 'rgba(255, 189, 70, 0.09)',
    grainOpacity: 0.035,
  },
  calm: {
    key: 'calm',
    badge: 'Calmo',
    caption: 'Equilíbrio aquoso com foco macio.',
    videoFilter: 'contrast(1.01) saturate(0.93) brightness(1.03)',
    accentFrom: 'rgba(157, 226, 255, 0.18)',
    accentTo: 'rgba(10, 27, 32, 0.28)',
    borderColor: 'rgba(187,235,255,0.32)',
    chipClassName: 'border-cyan-200/30 bg-cyan-100/10 text-cyan-50',
    overlayBlend: 'rgba(101, 213, 255, 0.08)',
    grainOpacity: 0.028,
  },
  motivated: {
    key: 'motivated',
    badge: 'Motivado',
    caption: 'Recorte quente e impulso visual limpo.',
    videoFilter: 'contrast(1.08) saturate(1.06) brightness(1.03)',
    accentFrom: 'rgba(255, 166, 179, 0.20)',
    accentTo: 'rgba(45, 13, 21, 0.30)',
    borderColor: 'rgba(255,203,209,0.34)',
    chipClassName: 'border-rose-200/30 bg-rose-100/10 text-rose-50',
    overlayBlend: 'rgba(255, 103, 137, 0.08)',
    grainOpacity: 0.035,
  },
  tired: {
    key: 'tired',
    badge: 'Cansaço',
    caption: 'Cinza-lilás sereno para acolher a pausa.',
    videoFilter: 'contrast(0.98) saturate(0.86) brightness(1.00)',
    accentFrom: 'rgba(199, 190, 224, 0.18)',
    accentTo: 'rgba(20, 18, 24, 0.30)',
    borderColor: 'rgba(222,216,236,0.30)',
    chipClassName: 'border-slate-200/30 bg-slate-100/10 text-slate-50',
    overlayBlend: 'rgba(173, 160, 206, 0.08)',
    grainOpacity: 0.022,
  },
  sad: {
    key: 'sad',
    badge: 'Triste',
    caption: 'Profundidade azul cuidada, sem excesso.',
    videoFilter: 'contrast(1.00) saturate(0.88) brightness(0.99) hue-rotate(4deg)',
    accentFrom: 'rgba(148, 181, 255, 0.18)',
    accentTo: 'rgba(11, 18, 37, 0.30)',
    borderColor: 'rgba(193,213,255,0.30)',
    chipClassName: 'border-blue-200/30 bg-blue-100/10 text-blue-50',
    overlayBlend: 'rgba(87, 137, 255, 0.08)',
    grainOpacity: 0.026,
  },
  overwhelmed: {
    key: 'overwhelmed',
    badge: 'Sobrecarga',
    caption: 'Violeta frio e contenção visual para simplificar.',
    videoFilter: 'contrast(1.02) saturate(0.90) brightness(0.99)',
    accentFrom: 'rgba(186, 170, 255, 0.18)',
    accentTo: 'rgba(22, 12, 37, 0.31)',
    borderColor: 'rgba(213,203,255,0.32)',
    chipClassName: 'border-violet-200/30 bg-violet-100/10 text-violet-50',
    overlayBlend: 'rgba(137, 101, 255, 0.08)',
    grainOpacity: 0.024,
  },
};

const resolveCameraEffectPreset = (effectKey?: CameraEffectKey): CameraEffectPreset =>
  CAMERA_EFFECT_PRESETS[effectKey || 'default'] || CAMERA_EFFECT_PRESETS.default;

const applyEffectTreatment = (ctx: CanvasRenderingContext2D, preset: CameraEffectPreset, dstW: number, dstH: number) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, dstH);
  gradient.addColorStop(0, preset.accentFrom);
  gradient.addColorStop(1, preset.accentTo);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, dstW, dstH);
  ctx.restore();

  const glow = ctx.createRadialGradient(dstW * 0.5, dstH * 0.32, dstW * 0.08, dstW * 0.5, dstH * 0.32, dstW * 0.72);
  glow.addColorStop(0, preset.overlayBlend);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, dstW, dstH);

  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 96;
  grainCanvas.height = 96;
  const grainCtx = grainCanvas.getContext('2d');
  if (!grainCtx) return;
  const grain = grainCtx.createImageData(96, 96);
  for (let i = 0; i < grain.data.length; i += 4) {
    const value = Math.random() * 255;
    grain.data[i] = value;
    grain.data[i + 1] = value;
    grain.data[i + 2] = value;
    grain.data[i + 3] = Math.round(255 * preset.grainOpacity);
  }
  grainCtx.putImageData(grain, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat') || '#000';
  ctx.fillRect(0, 0, dstW, dstH);
  ctx.restore();
};

export const CameraWidget: React.FC<{
  onCapture: (result: CameraCaptureResult) => void;
  allowUpload?: boolean;
  variant?: CameraVariant;
  effectKey?: CameraEffectKey;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  helperText?: string;
  captureLabel?: string;
  uploadLabel?: string;
  onBack?: () => void;
  onClose?: () => void;
  immersive?: boolean;
}> = ({
  onCapture,
  allowUpload = true,
  variant = 'POST',
  effectKey = 'default',
  eyebrow = 'Autorretrato Ritual',
  title = 'Enquadre sua presença',
  subtitle = 'Luz suave, rosto centrado e um instante inteiro de honestidade.',
  helperText = 'Toque no botão central quando sentir que a imagem revela seu estado atual.',
  captureLabel = 'Capturar',
  uploadLabel = 'Galeria',
  onBack,
  onClose,
  immersive = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [camError, setCamError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [lastImportedLabel, setLastImportedLabel] = useState<string | null>(null);
  const effectPreset = useMemo(() => resolveCameraEffectPreset(effectKey), [effectKey]);
  const { showToast } = useAppToast();

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
      },
    })
      .then((stream) => {
        mediaStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
        }
        setCamError(null);
      })
      .catch((err) => {
        captureFrontendError(err, { component: 'CameraWidget', op: 'getUserMedia' });
        setCamError('Não foi possível acessar a câmera. Verifique as permissões ou use o upload.');
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getTarget = () => {
    if (variant === 'SQUARE') return { w: 1080, h: 1080, tw: 640, th: 640 };
    if (variant === 'STORY') return { w: 1080, h: 1920, tw: 720, th: 1280 };
    return { w: 1080, h: 1350, tw: 720, th: 900 };
  };

  const drawCover = (
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
  ) => {
    const srcAspect = srcW / srcH;
    const dstAspect = dstW / dstH;
    let sX = 0;
    let sY = 0;
    let sW = srcW;
    let sH = srcH;

    if (srcAspect > dstAspect) {
      sW = Math.round(srcH * dstAspect);
      sX = Math.round((srcW - sW) / 2);
    } else {
      sH = Math.round(srcW / dstAspect);
      sY = Math.round((srcH - sH) / 2);
    }

    ctx.drawImage(source, sX, sY, sW, sH, 0, 0, dstW, dstH);
  };

  const drawContain = (
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
  ) => {
    const scale = Math.min(dstW / srcW, dstH / srcH);
    const drawW = Math.round(srcW * scale);
    const drawH = Math.round(srcH * scale);
    const dX = Math.round((dstW - drawW) / 2);
    const dY = Math.round((dstH - drawH) / 2);
    ctx.drawImage(source, 0, 0, srcW, srcH, dX, dY, drawW, drawH);
  };

  const drawFramedPhoto = (
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
  ) => {
    ctx.save();
    ctx.clearRect(0, 0, dstW, dstH);

    ctx.save();
    ctx.filter = 'blur(22px) saturate(1.08) brightness(0.88)';
    drawCover(ctx, source, srcW, srcH, dstW, dstH);
    ctx.restore();

    ctx.fillStyle = 'rgba(5, 10, 12, 0.26)';
    ctx.fillRect(0, 0, dstW, dstH);

    const vignette = ctx.createRadialGradient(dstW / 2, dstH / 2, Math.min(dstW, dstH) * 0.18, dstW / 2, dstH / 2, Math.max(dstW, dstH) * 0.76);
    vignette.addColorStop(0, 'rgba(255,255,255,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, dstW, dstH);

    ctx.save();
    drawContain(ctx, source, srcW, srcH, dstW, dstH);
    ctx.restore();

    applyEffectTreatment(ctx, effectPreset, dstW, dstH);
    ctx.restore();
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem.'))), type, quality);
    });

  const buildThumb = async (w: number, h: number) => {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = w;
    thumbCanvas.height = h;
    const tctx = thumbCanvas.getContext('2d', { alpha: false });
    if (!tctx || !canvasRef.current) throw new Error('Falha ao gerar thumbnail.');
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'high';
    drawFramedPhoto(tctx, canvasRef.current, canvasRef.current.width, canvasRef.current.height, w, h);
    return thumbCanvas.toDataURL('image/jpeg', 0.88);
  };

  const finishCapture = async () => {
    if (!canvasRef.current) return;
    const fullBlob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.93);
    const { tw, th, w, h } = getTarget();
    const thumbDataUrl = await buildThumb(tw, th);
    setFlash(true);
    setTimeout(() => setFlash(false), 140);
    onCapture({ fullBlob, thumbDataUrl, width: w, height: h });
  };

  const capture = async () => {
    try {
      if (!videoRef.current || !canvasRef.current || isCapturing) return;
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      if (!ctx) return;
      setIsCapturing(true);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const vW = videoRef.current.videoWidth;
      const vH = videoRef.current.videoHeight;
      if (!vW || !vH) throw new Error('Camera ainda não está pronta. Aguarde um instante e tente novamente.');

      const { w, h } = getTarget();
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      drawFramedPhoto(ctx, videoRef.current, vW, vH, w, h);

      const stream = videoRef.current.srcObject as MediaStream | null;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      await finishCapture();
    } catch (e) {
      captureFrontendError(e, { component: 'CameraWidget', op: 'capture' });
      setCamError('Não foi possível capturar a foto. Tente novamente ou use o upload.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('processing');
    setLastImportedLabel(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      try {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d', { alpha: false });
        if (!ctx) return;
        const { w, h } = getTarget();
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFramedPhoto(ctx, img, img.width, img.height, w, h);
        await finishCapture();
        setUploadState('ready');
        showToast({
          title: 'Foto importada',
          message: 'Imagem da galeria preparada com o mesmo tratamento premium da câmera.',
          type: 'success',
        });
      } catch (error) {
        captureFrontendError(error, { component: 'CameraWidget', op: 'uploadCapture' });
        setCamError('Não foi possível preparar essa imagem. Tente outra foto.');
        setUploadState('idle');
      } finally {
        URL.revokeObjectURL(url);
        e.target.value = '';
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      e.target.value = '';
      setUploadState('idle');
      setCamError('Não foi possível abrir essa imagem. Tente outro arquivo.');
    };
    img.src = url;
  };

  const rootClassName = immersive
    ? 'relative flex h-full min-h-0 flex-col overflow-hidden bg-[#030507]'
    : 'flex h-full flex-col overflow-hidden rounded-[3rem] bg-[#030507]';

  return (
    <div className={rootClassName}>
      <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover scale-x-[-1]"
          style={{ filter: effectPreset.videoFilter }}
        />
        {camError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#030507] px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
              <Camera size={36} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-white/35">Acesso à câmera</p>
              <p className="text-sm leading-relaxed text-white/70">{camError}</p>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {flash && <div className="pointer-events-none absolute inset-0 z-30 bg-white/80" />}
        {(isCapturing || uploadState === 'processing') && <div className="pointer-events-none absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px]" />}

        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle,transparent_45%,rgba(0,0,0,0.42)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-10" style={{ background: `linear-gradient(180deg, ${effectPreset.accentFrom} 0%, rgba(0,0,0,0.02) 30%, ${effectPreset.accentTo} 100%)` }} />
        {immersive ? (
          <>
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 sm:inset-x-6 sm:top-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {onBack ? (
                    <button onClick={onBack} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-xl transition-all hover:bg-black/40 active:scale-95">
                      <ArrowLeft size={18} />
                    </button>
                  ) : <div className="h-12 w-12" />}
                  <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/75">{eyebrow}</p>
                  </div>
                </div>
                {onClose ? (
                  <button onClick={onClose} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-xl transition-all hover:bg-black/40 active:scale-95">
                    <X size={18} />
                  </button>
                ) : <div className="h-12 w-12" />}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-4 top-24 z-20 sm:inset-x-6 sm:top-28">
              <div className="max-w-xl space-y-3 rounded-[2rem] border border-white/10 bg-black/18 p-5 backdrop-blur-[18px] sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] ${effectPreset.chipClassName}`}>
                    <Sparkles size={12} className="mr-2" />
                    {effectPreset.badge}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                    {variant === 'STORY' ? 'Story 9:16' : variant === 'SQUARE' ? 'Square 1:1' : 'Feed 4:5'}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-3xl italic leading-tight text-white sm:text-4xl">{title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/72">{subtitle}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="pointer-events-none absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
            <div className={`inline-flex items-center rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] backdrop-blur-xl ${effectPreset.chipClassName}`}>
              <Sparkles size={12} className="mr-2" />
              {effectPreset.badge}
            </div>
          </div>
        )}

        {!camError && (
          <>
            {uploadState !== 'idle' && (
              <div className="pointer-events-none absolute inset-x-4 top-[8.5rem] z-20 flex justify-center sm:inset-x-6 sm:top-[9.5rem]">
                <div className="max-w-md rounded-[1.6rem] border border-white/10 bg-black/28 px-4 py-3 text-center backdrop-blur-2xl shadow-xl">
                  <div className="flex items-center justify-center gap-2">
                    {uploadState === 'processing' ? (
                      <>
                        <Sparkles size={14} className="text-white/80 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/80">Lapidando imagem da galeria</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/80">Galeria integrada ao ritual</span>
                      </>
                    )}
                  </div>
                  {lastImportedLabel ? (
                    <p className="mt-2 truncate text-[11px] text-white/56">{lastImportedLabel}</p>
                  ) : null}
                </div>
              </div>
            )}
            <div className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 ${immersive ? 'pb-24 pt-36 sm:px-10 sm:pb-28' : 'pb-12 pt-12 sm:px-8'}`}>
              <div className="relative h-full max-h-[72vh] w-full max-w-[26rem] rounded-[2.8rem] border shadow-[0_0_60px_rgba(0,0,0,0.25)] sm:max-w-[28rem]"
                style={{ borderColor: effectPreset.borderColor }}
              >
                <div className="absolute inset-0 rounded-[2.8rem] border border-white/12" />
                <div className="absolute left-5 top-5 h-10 w-10 rounded-full border border-white/12" />
                <div className="absolute right-5 top-5 h-10 w-10 rounded-full border border-white/12" />
                <div className="absolute bottom-5 left-5 h-10 w-10 rounded-full border border-white/12" />
                <div className="absolute bottom-5 right-5 h-10 w-10 rounded-full border border-white/12" />
              </div>
            </div>
            <div className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center px-5 ${immersive ? 'bottom-36 sm:bottom-40' : 'bottom-28'}`}>
              <div className="rounded-full border border-white/10 bg-black/24 px-5 py-3 text-center backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/70">{effectPreset.caption}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="relative z-20 border-t border-white/8 bg-[linear-gradient(180deg,rgba(6,10,14,0.84),rgba(2,4,6,0.97))] px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4 backdrop-blur-xl sm:px-6 sm:pt-5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-[5rem]">
              {allowUpload ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex h-14 min-w-[5rem] items-center justify-center gap-2 rounded-[1.4rem] border px-4 transition-all active:scale-95 ${uploadState === 'ready' ? 'border-emerald-200/30 bg-emerald-100/12 text-emerald-50 hover:bg-emerald-100/16' : 'border-white/10 bg-white/8 text-white/90 hover:bg-white/14'}`}
                  >
                    <ImageIcon size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">{uploadState === 'ready' ? 'Importado' : uploadLabel}</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </>
              ) : (
                <div className="h-14 min-w-[5rem]" />
              )}
            </div>

            <button
              onClick={capture}
              disabled={isCapturing}
              className="group relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0_0_0_10px_rgba(255,255,255,0.08),0_20px_50px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 sm:h-28 sm:w-28"
            >
              <span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 1px ${effectPreset.borderColor} inset` }} />
              <span className="absolute inset-3 rounded-full bg-[#040506] opacity-12 transition-all group-hover:opacity-18" />
              <span className="relative flex h-full w-full items-center justify-center rounded-full border-[5px] border-[#101617] bg-white" />
            </button>

            <div className="min-w-[5rem] text-right">
              <span className="inline-flex items-center rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                {captureLabel}
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] leading-relaxed text-white/70 sm:text-xs">{helperText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
