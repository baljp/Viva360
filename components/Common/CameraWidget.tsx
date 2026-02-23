import React, { useRef, useState, useEffect } from 'react';
import { Camera, ImageIcon } from 'lucide-react';

export type CameraCaptureResult = {
  fullBlob: Blob;
  thumbDataUrl: string;
  width: number;
  height: number;
};

type CameraVariant = 'POST' | 'STORY' | 'SQUARE';

export const CameraWidget: React.FC<{
  onCapture: (result: CameraCaptureResult) => void;
  allowUpload?: boolean;
  variant?: CameraVariant;
}> = ({ onCapture, allowUpload = true, variant = 'POST' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [camError, setCamError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => { 
      let mediaStream: MediaStream | null = null;
      navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: { ideal: 'user' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 }
        } 
      })
        .then(stream => { 
            mediaStream = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
            }
            setCamError(null);
        })
        .catch(err => {
            console.error("Camera error:", err);
            setCamError("Não foi possível acessar a câmera. Verifique as permissões ou use o upload.");
        }); 

      return () => {
          if (mediaStream) {
              mediaStream.getTracks().forEach(track => track.stop());
          }
      };
  }, []);

  const getTarget = () => {
    if (variant === 'SQUARE') return { w: 1080, h: 1080, tw: 540, th: 540 };
    if (variant === 'STORY') return { w: 1080, h: 1920, tw: 540, th: 960 };
    return { w: 1080, h: 1350, tw: 540, th: 675 }; // POST (4:5)
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

  // Root-cause fix:
  // Before, we always used a hard "cover" crop to force 9:16/4:5 which cuts a lot of content
  // from landscape webcam/uploads. We now compose an Instagram-like canvas preserving the full
  // photo (contain) over a blurred background fill.
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

    // Background fill (cover) so the final asset keeps the requested story/post dimensions.
    ctx.save();
    ctx.filter = 'blur(20px) saturate(1.08) brightness(0.9)';
    drawCover(ctx, source, srcW, srcH, dstW, dstH);
    ctx.restore();

    // Soft dim + vignette for a premium frame without harsh bars.
    ctx.fillStyle = 'rgba(5, 10, 12, 0.28)';
    ctx.fillRect(0, 0, dstW, dstH);
    const vignette = ctx.createRadialGradient(dstW / 2, dstH / 2, Math.min(dstW, dstH) * 0.2, dstW / 2, dstH / 2, Math.max(dstW, dstH) * 0.75);
    vignette.addColorStop(0, 'rgba(255,255,255,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.24)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, dstW, dstH);

    // Foreground preserved (contain) with subtle inset shadow.
    ctx.save();
    drawContain(ctx, source, srcW, srcH, dstW, dstH);
    ctx.restore();
    ctx.restore();
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem.'))),
        type,
        quality,
      );
    });

  const capture = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      if (!ctx) return;
      if (isCapturing) return;
      setIsCapturing(true);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const vW = videoRef.current.videoWidth;
      const vH = videoRef.current.videoHeight;
      if (!vW || !vH) {
        throw new Error('Camera ainda não está pronta. Aguarde um instante e tente novamente.');
      }

      const { w, h, tw, th } = getTarget();
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      ctx.clearRect(0, 0, w, h);
      drawFramedPhoto(ctx, videoRef.current, vW, vH, w, h);

      // Stop stream immediately after capture
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const fullBlob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.9);

      // Thumb for network payload (keeps backend+CDN light).
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = tw;
      thumbCanvas.height = th;
      const tctx = thumbCanvas.getContext('2d', { alpha: false });
      if (!tctx) throw new Error('Falha ao gerar thumbnail.');
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';
      drawFramedPhoto(tctx, canvasRef.current, w, h, tw, th);
      const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.82);

      // Quick shutter flash for premium feedback.
      setFlash(true);
      setTimeout(() => setFlash(false), 140);

      onCapture({ fullBlob, thumbDataUrl, width: w, height: h });
    } catch (e) {
      console.error('[CameraWidget] capture failed', e);
      setCamError('Não foi possível capturar a foto. Tente novamente ou use o upload.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = async () => {
              try {
                  const { w, h, tw, th } = getTarget();
                  if (!canvasRef.current) return;
                  const ctx = canvasRef.current.getContext('2d', { alpha: false });
                  if (!ctx) return;
                  canvasRef.current.width = w;
                  canvasRef.current.height = h;
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  ctx.clearRect(0, 0, w, h);
                  drawFramedPhoto(ctx, img, img.width, img.height, w, h);

                  const fullBlob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.9);

                  const thumbCanvas = document.createElement('canvas');
                  thumbCanvas.width = tw;
                  thumbCanvas.height = th;
                  const tctx = thumbCanvas.getContext('2d', { alpha: false });
                  if (!tctx) return;
                  tctx.imageSmoothingEnabled = true;
                  tctx.imageSmoothingQuality = 'high';
                  drawFramedPhoto(tctx, canvasRef.current, w, h, tw, th);
                  const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.82);

                  onCapture({ fullBlob, thumbDataUrl, width: w, height: h });
              } finally {
                  URL.revokeObjectURL(url);
              }
          };
          img.src = url;
      }
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-[3rem] overflow-hidden">
      {/* Viewport de Vídeo - Ocupa todo o espaço disponível MENOS a barra de controle */}
      <div className="flex-1 relative overflow-hidden bg-nature-900 flex items-center justify-center">
          {camError ? (
              <div className="px-8 text-center space-y-4">
                  <Camera size={48} className="mx-auto text-nature-300 opacity-50" />
                  <p className="text-sm text-nature-200">{camError}</p>
              </div>
          ) : (
              <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                  style={{ filter: 'contrast(1.04) saturate(1.08) brightness(1.02)' }}
              />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Shutter flash + processing state */}
          {flash && <div className="absolute inset-0 bg-white/70 pointer-events-none z-30" />}
          {isCapturing && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-none z-20" />
          )}
          
          {/* Aesthetic Overlays (Instagram Mode) */}
          {!camError && (
              <>
                {/* Vignette */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.2)_100%)]"></div>
                
                {/* Dreamy Glow */}
                <div className="absolute inset-0 pointer-events-none bg-indigo-500/5 mix-blend-screen opacity-30"></div>
                
                {/* Focus indicator */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                    <div className="w-64 h-64 border-2 border-white/30 rounded-[2.5rem] shadow-[0_0_20px_rgba(255,255,255,0.1)]"></div>
                </div>
              </>
          )}
      </div>
      
      {/* Barra de Controles Dedicada - Não sobreposta */}
      <div className="h-32 bg-nature-900/95 flex justify-between items-center px-12 border-t border-white/10 relative z-20 pb-4">
          <div className="w-12">
              {/* Espaço para balancear o layout */}
          </div>

          {/* Botão Capturar Principal */}
          <button onClick={capture} className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1.5 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <div className="w-full h-full bg-white rounded-full border-4 border-nature-900"></div>
          </button>

          {/* Botão Upload */}
          <div className="w-12 flex justify-center">
              {allowUpload && (
                  <>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-90"
                    >
                        <ImageIcon size={24} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                    />
                  </>
              )}
          </div>
      </div>
    </div>
  );
};
