import React, { useState, useRef } from 'react';
import { Camera, X, RotateCcw, Check, Sparkles, Image, Zap, Sun, Moon, Leaf, FlipHorizontal } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string, filter?: string) => void;
  onClose: () => void;
}

const FILTERS = [
  { id: 'none', name: 'Natural', icon: Sun, style: '' },
  { id: 'sepia', name: 'Sépia', icon: Moon, style: 'sepia(0.7)' },
  { id: 'nature', name: 'Natureza', icon: Leaf, style: 'saturate(1.3) hue-rotate(-10deg)' },
  { id: 'aurora', name: 'Aurora', icon: Sparkles, style: 'saturate(1.5) brightness(1.1) contrast(1.1)' },
  { id: 'zen', name: 'Zen', icon: Zap, style: 'grayscale(0.3) contrast(1.1)' },
];

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  // Flip camera
  const flipCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply filter
    const filter = FILTERS.find(f => f.id === selectedFilter);
    if (filter?.style) {
      ctx.filter = filter.style;
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  // Retake photo
  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Confirm and use photo
  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage, selectedFilter);
    }
  };

  // Auto-start camera on mount
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"
        >
          <X size={24} />
        </button>
        
        {isStreaming && !capturedImage && (
          <button
            onClick={flipCamera}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"
          >
            <FlipHorizontal size={24} />
          </button>
        )}
      </header>

      {/* Camera Preview */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <Camera size={48} className="text-white/50 mx-auto mb-4" />
            <p className="text-white/70">{error}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-6 py-3 bg-white/10 text-white rounded-full"
            >
              Tentar novamente
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
            style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style || '' }}
          />
        )}
        
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay frame */}
        {isStreaming && !capturedImage && (
          <div className="absolute inset-8 border-2 border-white/20 rounded-[3rem] pointer-events-none" />
        )}
      </div>

      {/* Filters */}
      {!capturedImage && isStreaming && (
        <div className="absolute bottom-32 left-0 right-0 px-4">
          <div className="flex justify-center gap-3">
            {FILTERS.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-white text-nature-900'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{filter.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {capturedImage ? (
          <div className="flex justify-center gap-6">
            <button
              onClick={retake}
              className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
            >
              <RotateCcw size={28} />
            </button>
            <button
              onClick={confirmPhoto}
              className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
            >
              <Check size={36} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full border-4 border-nature-900" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
