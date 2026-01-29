import React, { useRef, useState, useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Users, Share2, Copy, Crown, Star, Sparkles, Send } from 'lucide-react';

export default function TribeInvite() {
  const { go, back } = useBuscadorFlow();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteImage, setInviteImage] = useState<string | null>(null);

  const INVITE_LINK = 'viva360.app/tribe/u/joao-luz';
  const INVITE_TEXT = "Olá! Estou te convidando para fazer parte da minha Tribo de Evolução no Viva360. Vamos expandir nossa consciência juntos. 🌿✨";

  // Generate Invite Card
  useEffect(() => {
    generateCard();
  }, []);

  const generateCard = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 1080;
      const H = 1920; // Story Format
      canvas.width = W;
      canvas.height = H;

      // Background - Deep Royal Indigo
      const bgGrad = ctx.createLinearGradient(0,0,0,H);
      bgGrad.addColorStop(0, '#312e81'); // Indigo 900
      bgGrad.addColorStop(1, '#1e1b4b'); // Indigo 950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,W,H);

      // Ornaments
      ctx.strokeStyle = '#fbbf24'; // Amber 400 (Gold)
      ctx.lineWidth = 4;
      ctx.strokeRect(40,40,W-80,H-80);

      ctx.beginPath();
      ctx.arc(W/2, 300, 100, 0, Math.PI*2);
      ctx.fillStyle = '#4338ca';
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 80px "Times New Roman", serif';
      ctx.fillText('CONVITE REAL', W/2, 600);
      
      ctx.fillStyle = '#fff';
      ctx.font = '40px sans-serif';
      ctx.fillText('Você foi chamado para a tribo de', W/2, 700);
      
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText('JOÃO LUZ', W/2, 800);

      ctx.font = 'italic 40px serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('"A evolução é mais leve quando compartilhada."', W/2, 1000);

      // Button Sim
      ctx.fillStyle = '#fff';
      ctx.roundRect(W/2 - 250, 1200, 500, 120, 60);
      ctx.fill();
      
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('ACEITAR CHAMADO', W/2, 1275);
      
      // Footer Link
      ctx.fillStyle = '#fbbf24';
      ctx.font = '30px monospace';
      ctx.fillText(INVITE_LINK, W/2, 1500);

      setInviteImage(canvas.toDataURL());
  };

  const shareInvite = async (platform: 'whatsapp' | 'generic') => {
      if (!canvasRef.current) return;
      
      try {
          const blob = await (await fetch(canvasRef.current.toDataURL())).blob();
          const file = new File([blob], 'convite-viva360.png', { type: 'image/png' });

          if (platform === 'whatsapp') {
             // WhatsApp text share is easy, image requires native share usually
             if (navigator.share) {
                 await navigator.share({
                     title: 'Convite Tribo Viva360',
                     text: `${INVITE_TEXT} \n\n${INVITE_LINK}`,
                     files: [file]
                 });
             } else {
                 // Desktop Fallback
                 const text = encodeURIComponent(`${INVITE_TEXT} \n\n${INVITE_LINK}`);
                 window.open(`https://wa.me/?text=${text}`, '_blank');
             }
          } else {
              if (navigator.share) {
                  await navigator.share({
                      title: 'Convite Tribo',
                      text: INVITE_TEXT,
                      url: `https://${INVITE_LINK}`,
                      files: [file]
                   });
              }
          }
      } catch (e) {
          console.error(e);
          alert('Erro ao compartilhar. Tente copiar o link.');
      }
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center p-6 relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full"></div>
       </div>

       {/* Header */}
       <div className="relative z-10 w-full flex justify-between items-center mb-8 pt-4">
           <button onClick={back} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
               <span className="text-xl">←</span>
           </button>
           <h3 className="text-white font-serif italic text-lg opacity-80">Expandir Círculo</h3>
           <div className="w-10"></div>
       </div>

       <canvas ref={canvasRef} className="hidden" />

       {/* Main Card Preview */}
       <div className="relative z-10 w-full max-w-sm aspect-[9/16] bg-white rounded-[2rem] shadow-2xl overflow-hidden mb-8 border-4 border-white/10 rotate-1 transform transition-transform hover:rotate-0">
           {inviteImage ? (
               <img src={inviteImage} className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-white">Gerando Convite...</div>
           )}
           
           {/* Floating Badge */}
           <div className="absolute top-6 right-6 w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center text-indigo-900 font-bold shadow-lg shadow-amber-400/50 animate-bounce">
               <Crown size={24} />
           </div>
       </div>

       {/* Actions */}
       <div className="w-full max-w-sm space-y-4 relative z-10">
           <button onClick={() => shareInvite('whatsapp')} className="w-full py-4 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               <Send size={20} /> Enviar no WhatsApp
           </button>

           <div className="grid grid-cols-2 gap-4">
               <button onClick={() => shareInvite('generic')} className="py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest active:scale-95 transition-all">
                   <Share2 size={18} /> Outros
               </button>
               <button onClick={() => { navigator.clipboard.writeText(`https://${INVITE_LINK}`); alert('Link Copiado!'); }} className="py-4 bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest active:scale-95 transition-all">
                   <Copy size={18} /> Copiar
               </button>
           </div>
       </div>
    </div>
  );
}
