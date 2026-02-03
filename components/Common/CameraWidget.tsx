import React, { useRef, useState, useEffect } from 'react';
import { Camera, ImageIcon } from 'lucide-react';

export const CameraWidget: React.FC<{ onCapture: (img: string) => void, allowUpload?: boolean }> = ({ onCapture, allowUpload = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [camError, setCamError] = useState<string | null>(null);

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

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      if (ctx) {
        // High Quality Settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Match UI aspect ratio or video resolution?
        // Let's use video resolution but ensure it's high
        const vW = videoRef.current.videoWidth;
        const vH = videoRef.current.videoHeight;
        canvasRef.current.width = vW; 
        canvasRef.current.height = vH;
        
        // Apply Instagram-style filters to the canvas context
        ctx.filter = 'contrast(1.06) saturate(1.15) brightness(1.02) sepia(0.02)';
        ctx.drawImage(videoRef.current, 0, 0, vW, vH); 
        
        // Add subtle vignette to capture
        const vignette = ctx.createRadialGradient(vW/2, vH/2, 0, vW/2, vH/2, Math.sqrt(vW**2 + vH**2)/2);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.8, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, vW, vH);
        
        // Stop stream immediately after capture
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Premium Quality JPEG
        onCapture(canvasRef.current.toDataURL('image/jpeg', 0.95));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) onCapture(ev.target.result as string);
          };
          reader.readAsDataURL(file);
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
                  style={{ filter: 'contrast(1.06) saturate(1.15) brightness(1.02) sepia(0.02)' }}
              />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
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
