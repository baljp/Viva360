import React, { useState } from 'react';
import { Sparkles, Share2, Instagram, Download, X } from 'lucide-react';
import { dataUrlToBlob } from '../utils/dataUrl';

interface OracleMessage {
    id: string;
    text: string;
    category: string;
    element: string;
    depth: number;
}

interface OracleCardProps {
    card: OracleMessage;
    onClose: () => void;
}

export const OracleCard: React.FC<OracleCardProps> = ({ card, onClose }) => {
    const [flipped, setFlipped] = useState(false);

    const getElementColor = (el: string) => {
        switch (el) {
            case 'Fogo': return 'from-amber-600 to-red-600';
            case 'Agua': return 'from-blue-600 to-cyan-600';
            case 'Terra': return 'from-emerald-600 to-green-800';
            case 'Ar': return 'from-slate-400 to-sky-300';
            default: return 'from-purple-600 to-indigo-900';
        }
    };

    const getElementIcon = (el: string) => {
        switch (el) {
            case 'Fogo': return '🔥';
            case 'Agua': return '💧';
            case 'Terra': return '🌱';
            case 'Ar': return '🌬️';
            default: return '✨';
        }
    };

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const shareCard = async () => {
        if (!canvasRef.current) return;
        setIsSharing(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Setup Canvas (Story Format 1080x1920)
        const W = 1080;
        const H = 1920;
        canvas.width = W;
        canvas.height = H;

        // 2. Draw Background
        // Deep gradient based on element
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        switch (card.element) {
            case 'Fogo': gradient.addColorStop(0, '#7c2d12'); gradient.addColorStop(1, '#451a03'); break;
            case 'Agua': gradient.addColorStop(0, '#0c4a6e'); gradient.addColorStop(1, '#082f49'); break;
            case 'Terra': gradient.addColorStop(0, '#14532d'); gradient.addColorStop(1, '#052e16'); break;
            case 'Ar': gradient.addColorStop(0, '#475569'); gradient.addColorStop(1, '#1e293b'); break;
            default: gradient.addColorStop(0, '#312e81'); gradient.addColorStop(1, '#1e1b4b');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // 3. Add Texture/Grain (Simulated with noise or overlay circles)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.05;
        for(let i=0; i<100; i++) {
            ctx.beginPath();
            ctx.arc(Math.random()*W, Math.random()*H, Math.random()*2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 4. Draw Central Card Frame
        const cardW = 800;
        const cardH = 1200;
        const cardX = (W - cardW) / 2;
        const cardY = (H - cardH) / 2;

        // Glow behind card
        const glowValues = {
            'Fogo': '#ef4444', 'Agua': '#06b6d4', 'Terra': '#22c55e', 'Ar': '#94a3b8', 'Eter': '#6366f1'
        };
        const glowColor = glowValues[card.element as keyof typeof glowValues] || '#a855f7';
        
        const glow = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 600);
        glow.addColorStop(0, `${glowColor}60`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0,0,W,H);

        // Card Body
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 50;
        ctx.fillStyle = '#1a1a1a'; // Dark card base
        // Round Rect helper
        const roundRect = (x:number, y:number, w:number, h:number, r:number) => {
            ctx.beginPath();
            ctx.moveTo(x+r, y);
            ctx.arcTo(x+w, y, x+w, y+h, r);
            ctx.arcTo(x+w, y+h, x, y+h, r);
            ctx.arcTo(x, y+h, x, y, r);
            ctx.arcTo(x, y, x+w, y, r);
            ctx.closePath();
            ctx.fill();
        }
        roundRect(cardX, cardY, cardW, cardH, 40);
        ctx.shadowBlur = 0;

        // Inner Border (Gold/Premium)
        ctx.strokeStyle = '#fbbf24'; // Amber-400
        ctx.lineWidth = 4;
        ctx.stroke();

        // 5. Draw Content
        // Element Icon
        ctx.fillStyle = '#fbbf24';
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getElementIcon(card.element), W/2, cardY + 150);

        // Element Name
        ctx.font = 'bold 40px sans-serif'; // Simple sans for label
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.fillText(card.element.toUpperCase(), W/2, cardY + 220);
        ctx.globalAlpha = 1.0;

        // Divider
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.moveTo(W/2 - 50, cardY + 260); ctx.lineTo(W/2 + 50, cardY + 260); ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Main Insight Text (Wrap function)
        ctx.font = 'italic 500 60px "Times New Roman", serif';
        ctx.fillStyle = '#ffffff';
        const words = card.text.split(' ');
        let line = '';
        let y = H/2 - 100; // Start higher to center
        const maxWidth = cardW - 120;
        const lineHeight = 80;

        // Pre-calculate total height to center properly
        // Simpler approach for now: Fixed start with constrained width
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, W/2, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, W/2, y);

        // Date
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#94a3b8'; // Slate 400
        ctx.fillText(new Date().toLocaleDateString(), W/2, cardY + cardH - 100);

        // Branding
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText("VIVA360", W/2, H - 150);
        
        // 6. Share
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const blob = dataUrlToBlob(dataUrl);
            const file = new File([blob], 'oraculo-viva360.png', { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    title: 'Oráculo Viva360',
                    text: `✨ Uma mensagem do universo para mim: "${card.text}"\n\nDescubra sua guiança diária no Viva360. 🔮 #Viva360 #Oraculo`,
                    files: [file]
                });
            } else {
                // Fallback Download
                const link = document.createElement('a');
                link.download = 'oraculo-viva360.png';
                link.href = dataUrl;
                link.click();
            }
        } catch (e) {
            console.error("Share failed", e);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                <X size={24} />
            </button>
            
            {/* Hidden Canvas for Generation */}
            <canvas ref={canvasRef} className="hidden" />

            <div className={`relative w-full max-w-sm aspect-[2/3] perspective-1000 cursor-pointer group`} onClick={() => !flipped && setFlipped(true)}>
                <div className={`w-full h-full relative preserve-3d transition-transform duration-1000 ${flipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* BACK OF CARD (Initial View) */}
                    <div className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <div className="absolute inset-0 bg-nature-950 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                             <div className="w-full h-full absolute inset-0 opacity-20 bg-gradient-to-tr from-indigo-900 to-purple-900 animate-pulse" />
                             <div className="relative z-10 p-8 border border-white/10 rounded-full w-48 h-48 flex items-center justify-center animate-spin-slow">
                                 <Sparkles size={64} className="text-amber-200 opacity-80" />
                             </div>
                             <p className="absolute bottom-12 text-center text-amber-100/50 text-xs font-bold uppercase tracking-[0.4em] animate-pulse">Toque para revelar</p>
                        </div>
                    </div>

                    {/* FRONT OF CARD (Revealed) */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-[0_0_100px_rgba(255,215,0,0.2)] bg-nature-900`}>
                        {/* Dynamic Background */}
                        <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${getElementColor(card.element)}`} />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col p-8">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">
                                    {card.element} {getElementIcon(card.element)}
                                </div>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            {/* Main Insight */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-1 bg-white/20 rounded-full" />
                                <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed drop-shadow-lg">
                                    "{card.text}"
                                </p>
                                <div className="w-16 h-1 bg-white/20 rounded-full" />
                            </div>

                            {/* Footer / Actions */}
                            <div className="mt-auto space-y-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); shareCard(); }}
                                    disabled={isSharing}
                                    className="w-full py-4 bg-white text-nature-950 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all outline-none disabled:opacity-50"
                                >
                                    {isSharing ? <Sparkles size={18} className="animate-spin" /> : <Share2 size={18} />} 
                                    {isSharing ? 'Gerando Card...' : 'Compartilhar Insight'}
                                </button>
                                
                                <p className="text-center text-[8px] text-white/30 uppercase tracking-[0.3em]">Oráculo Viva360</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
