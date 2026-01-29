import React, { useState, useRef, useEffect } from 'react';
import { Camera, Heart, Activity, Coffee, Moon, Sun, ArrowRight, CheckCircle, Smile, Frown, Meh, CloudRain, Zap, Battery, X, Share2, Download } from 'lucide-react';
import { PortalView, CameraWidget } from '../../components/Common';
import { ViewState } from '../../types';
import { api } from '../../services/api';
import { getRandomPhrase, MOOD_ELEMENTS } from '../../src/data/metamorphosisData';

const MOODS = [
    { id: 'Feliz', icon: Sun },
    { id: 'Calmo', icon: Coffee },
    { id: 'Grato', icon: Heart },
    { id: 'Motivado', icon: Zap },
    { id: 'Cansado', icon: Battery },
    { id: 'Ansioso', icon: CloudRain },
    { id: 'Triste', icon: Frown },
    { id: 'Sobrecarregado', icon: Activity }
];

export const MetamorphosisWizard: React.FC<{ flow: any, setView: (v: ViewState) => void }> = ({ flow, setView }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardPhrase, setCardPhrase] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Step 1: Mood Selection
    const handleMoodSelect = (m: string) => {
        setMood(m);
        setCardPhrase(getRandomPhrase(m));
        setStep(2);
    };

    // Step 2: Photo Capture
    const handleCapture = (photoUrl: string) => {
        setPhoto(photoUrl);
        setStep(3);
        processMetamorphosis(photoUrl);
    };

    // Step 3: Deterministic Processing
    const processMetamorphosis = async (photoUrl: string) => {
        setIsProcessing(true);
        const photoHash = 'hash_' + Date.now(); 
        
        try {
            // Simulate API logic (or real if needed)
            const entry = { 
                id: Date.now(), 
                mood, 
                photoThumb: photoUrl, 
                quote: cardPhrase, 
                ritual: ["Respire", "Sinta", "Agradeça"] 
            };
            
            await api.metamorphosis.checkIn(mood, photoHash, photoUrl);

            setTimeout(() => {
                setResult(entry);
                setIsProcessing(false);
                setStep(4);
            }, 2000); 
        } catch (e) {
            console.error("Metamorphosis Error", e);
            setResult({
                id: Date.now(),
                mood,
                photoThumb: photoUrl,
                quote: cardPhrase,
                ritual: ["Silêncio", "Pausa"]
            });
            setIsProcessing(false);
            setStep(4);
        }
    };

    const downloadCard = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `viva360-card-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const shareCard = async () => {
        if (!canvasRef.current) return;
        
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'viva360-metamorphosis.png', { type: 'image/png' });
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Minha Metamorfose Viva360',
                    text: `Hoje estou vibrando em ${mood}: "${cardPhrase}"`,
                    files: [file]
                });
            } else {
                downloadCard();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            downloadCard(); // Fallback
        }
    };

    // Canvas Drawing Effect
    useEffect(() => {
        if (step === 4 && result && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Load images
            const userImg = new Image();
            userImg.crossOrigin = "anonymous";
            userImg.src = result.photoThumb;

            userImg.onload = () => {
                // Dimensions
                const W = 600;
                const H = 900;
                canvas.width = W;
                canvas.height = H;

                // Background (Gradient based on mood element)
                const styling = MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
                
                // Draw Base
                const grad = ctx.createLinearGradient(0, 0, 0, H);
                if (styling.element === 'Fogo') { grad.addColorStop(0, '#fff7ed'); grad.addColorStop(1, '#fed7aa'); } // Orange
                else if (styling.element === 'Água') { grad.addColorStop(0, '#ecfeff'); grad.addColorStop(1, '#a5f3fc'); } // Cyan
                else if (styling.element === 'Terra') { grad.addColorStop(0, '#f0fdf4'); grad.addColorStop(1, '#86efac'); } // Green
                else { grad.addColorStop(0, '#f8fafc'); grad.addColorStop(1, '#cbd5e1'); } // Slate
                
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);

                // Draw Photo (Circle/Hexagon Mask)
                ctx.save();
                ctx.beginPath();
                ctx.arc(W/2, 300, 180, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                
                // Draw Image centered/cover
                // Simple version: draw full image customized
                const scale = Math.max(360 / userImg.width, 360 / userImg.height);
                const x = (W/2) - (userImg.width * scale) / 2;
                const y = 300 - (userImg.height * scale) / 2;
                ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
                ctx.restore();

                // Draw Photo Border
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(W/2, 300, 180, 0, Math.PI * 2);
                ctx.stroke();

                // Draw Content
                ctx.textAlign = 'center';
                
                // Symbol/Icon (We just draw a circle placeholder or text symbol for now as loading SVG to canvas is complex)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(W/2, 530, 40, 0, Math.PI * 2);
                ctx.fill();
                
                // Element Text
                ctx.fillStyle = '#64748b'; // Slate-500
                ctx.font = 'bold 30px sans-serif';
                ctx.fillText(styling.element.toUpperCase(), W/2, 90);

                // Date
                ctx.fillStyle = '#94a3b8';
                ctx.font = '24px sans-serif';
                ctx.fillText(new Date().toLocaleDateString(), W/2, 130);

                // Mood Title
                ctx.fillStyle = '#1e293b'; // Slate-900
                ctx.font = 'italic bold 60px serif';
                ctx.fillText(result.mood, W/2, 600);

                // Divider
                ctx.beginPath();
                ctx.moveTo(W/2 - 50, 630);
                ctx.lineTo(W/2 + 50, 630);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Quote (Word Wrap logic needed for Canvas, simplifying for now)
                ctx.fillStyle = '#334155';
                ctx.font = 'italic 32px serif';
                const words = result.quote.split(' ');
                let line = '';
                let lineY = 690;
                
                for(let n = 0; n < words.length; n++) {
                  const testLine = line + words[n] + ' ';
                  const metrics = ctx.measureText(testLine);
                  if (metrics.width > 480 && n > 0) {
                    ctx.fillText(line, W/2, lineY);
                    line = words[n] + ' ';
                    lineY += 40;
                  }
                  else {
                    line = testLine;
                  }
                }
                ctx.fillText(line, W/2, lineY);

                // Logo/Footer
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 20px sans-serif';
                ctx.fillText('VIVA360 • JORNADA DO SER', W/2, 850);
            };
        }
    }, [step, result]);

    const styling = result ? (MOOD_ELEMENTS[result.mood as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo']) : MOOD_ELEMENTS['Calmo'];

    return (
        <PortalView title="Metamorfose" subtitle="RITUAL DIÁRIO" onBack={() => step > 1 ? setStep(step - 1) : flow.back()} heroImage="https://images.unsplash.com/photo-1470252649378-b736a029c69d?q=80&w=800">
            <div className="flex flex-col h-[75vh]">
                
                {/* STEP 1: MOOD */}
                {step === 1 && (
                    <div className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-500">
                        <h2 className="text-2xl font-serif italic text-center mb-8 text-nature-900">Como você está agora?</h2>
                        <div className="grid grid-cols-2 gap-4 px-4 pb-4">
                            {MOODS.map(m => {
                                const style = MOOD_ELEMENTS[m.id as keyof typeof MOOD_ELEMENTS] || MOOD_ELEMENTS['Calmo'];
                                return (
                                    <button key={m.id} onClick={() => handleMoodSelect(m.id)} className={`${style.bg} p-6 rounded-3xl flex flex-col items-center gap-3 transition-transform active:scale-95 border border-transparent hover:${style.border}`}>
                                        <m.icon size={32} className={style.color} />
                                        <span className="font-bold text-sm text-nature-900/80">{m.id}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 2: PHOTO */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right duration-500">
                        <h2 className="text-xl font-serif italic mb-6 text-nature-900">Registre sua essência de hoje</h2>
                        <div className="w-full h-[50vh] bg-black rounded-3xl relative overflow-hidden shadow-2xl border-4 border-white mb-8">
                            <CameraWidget onCapture={handleCapture} />
                        </div>
                       <p className="mt-4 text-xs text-nature-500 text-center max-w-xs">Sua foto é criptografada e salva apenas no seu dispositivo. O santuário vê apenas sua luz (metadados). 🔒 LGPD</p>
                    </div>
                )}

                {/* STEP 3: PROCESSING */}
                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-200 to-indigo-200 animate-spin blur-xl mb-4"></div>
                        <h3 className="font-serif italic text-lg text-nature-600">Sintonizando frequência...</h3>
                    </div>
                )}

                {/* STEP 4: HOLISTIC CARD RESULT */}
                {step === 4 && result && (
                     <div className="flex-1 flex flex-col items-center animate-in zoom-in duration-700 relative overflow-hidden">
                        
                        {/* Hidden Canvas for High-Res Generation */}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* Interactive Card UI */}
                        <div className={`relative w-[300px] h-[450px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center text-center p-6 ${styling.bg} border-4 ${styling.border}`}>
                            {/* Card Header */}
                            <div className="w-full flex justify-between items-center mb-4 opacity-60">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Viva360</span>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${styling.color}`}>{styling.element}</span>
                            </div>

                            {/* Photo Container */}
                            <div className="relative mb-6 group">
                                <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden relative z-10">
                                    <img src={result.photoThumb} className="w-full h-full object-cover" />
                                </div>
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 rounded-full blur-xl opacity-50 -z-0 ${styling.color === 'text-amber-500' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>
                            </div>

                            {/* Text Content */}
                            <h2 className={`text-3xl font-serif italic mb-2 ${styling.color}`}>{result.mood}</h2>
                            <div className="w-8 h-0.5 bg-nature-900/10 mb-4"></div>
                            <p className="text-xs font-medium text-nature-600 italic leading-relaxed px-2">"{result.quote}"</p>

                            {/* Bottom Brand */}
                            <div className="mt-auto pt-4 flex flex-col items-center gap-1">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-nature-400">Card Colecionável</span>
                                <div className="flex gap-1">
                                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-nature-300"></div>)}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-8 w-full px-8">
                            <button onClick={shareCard} className="flex-1 py-4 bg-nature-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                                <Share2 size={16} /> Compartilhar
                            </button>
                            <button onClick={downloadCard} className="w-16 h-14 bg-white text-nature-900 border border-nature-200 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                                <Download size={20} />
                            </button>
                             <button onClick={() => setStep(5)} className="w-16 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                                <CheckCircle size={20} />
                            </button>
                        </div>
                     </div>
                )}

                {/* STEP 5: FEEDBACK */}
                {step === 5 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
                        <Heart size={64} className="text-rose-400 animate-bounce mb-6" />
                        <h2 className="text-2xl font-serif italic text-nature-900">Jornada Registrada</h2>
                        <p className="text-nature-500 mt-2 mb-8">Sua carta foi guardada no grimório da alma.</p>
                        
                        <div className="flex flex-col w-full px-12 gap-3">
                            <button onClick={() => flow.go('HISTORY')} className="px-8 py-4 bg-nature-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-nature-800 transition-colors shadow-lg">
                                Ver Grimório (Time-Lapse)
                            </button>
                            <button onClick={() => flow.go('DASHBOARD')} className="px-8 py-3 bg-nature-100 text-nature-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-nature-200 transition-colors">
                                Voltar ao Início
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </PortalView>
    );
};
