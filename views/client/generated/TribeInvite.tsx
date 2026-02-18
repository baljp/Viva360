import React, { useRef, useState, useEffect } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Users, Share2, Copy, Crown, Star, Sparkles, Send } from 'lucide-react';

import { shareToSocial } from '../../../src/utils/sharing';
import { dataUrlToBlob } from '../../../src/utils/dataUrl';
import { api } from '../../../services/api';

export default function TribeInvite() {
  const { go, back, notify} = useBuscadorFlow();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteImage, setInviteImage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string>(() => `${window.location.origin}/invite`);
  const [inviterName, setInviterName] = useState<string>('Viva360');

  const INVITE_TEXT = `Olá! Estou te convidando para fazer parte da minha Tribo de Evolução no Viva360. Vamos expandir nossa consciência juntos. 🌿✨\n\n${inviteLink}`;

  // Generate Invite Card
  useEffect(() => {
    (async () => {
      try {
        const u = await api.auth.getCurrentSession();
        if (u?.name) setInviterName(String(u.name));
      } catch {
        // ignore
      }
      try {
        const created = await api.invites.create({ kind: 'tribo', targetRole: 'CLIENT' });
        const url = String((created as any)?.url || '').trim();
        if (url) setInviteLink(url);
      } catch (e) {
        console.warn('Invite create failed, falling back to generic /invite route', e);
      }
    })();
  }, []);

  useEffect(() => {
    generateCard();
  }, [inviteLink, inviterName]);

  const generateCard = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 1080;
      const H = 1920; // Story Format
      canvas.width = W;
      canvas.height = H;

      // Background - Deep Royal Indigo (Gradient)
      const bgGrad = ctx.createLinearGradient(0,0,0,H);
      bgGrad.addColorStop(0, '#312e81'); // Indigo 900
      bgGrad.addColorStop(0.5, '#4338ca'); // Indigo 700
      bgGrad.addColorStop(1, '#1e1b4b'); // Indigo 950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,W,H);

      // Ornaments (Golden Geometry)
      ctx.strokeStyle = '#fbbf24'; // Amber 400
      ctx.lineWidth = 4;
      ctx.strokeRect(60,60,W-120,H-120);

      // Central Mandala Halo
      ctx.save();
      ctx.globalAlpha = 0.1;
      for(let i=0; i<360; i+=15) {
          ctx.beginPath();
          ctx.ellipse(W/2, H/3, 400, 100, (i * Math.PI) / 180, 0, 2 * Math.PI);
          ctx.stroke();
      }
      ctx.restore();

      // Avatar/Icon Placeholder
      ctx.beginPath();
      ctx.arc(W/2, 400, 120, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.stroke();
      
      // Avatar Text Initial
      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((inviterName || 'V').slice(0, 1).toUpperCase(), W/2, 400);

      // Text Content
      ctx.textAlign = 'center';
      
      // "CONVITE REAL" Badge
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 60px "Times New Roman", serif';
      // ctx.letterSpacing removed to fix type error
      ctx.fillText('CONVITE REAL', W/2, 650);
      
      ctx.fillStyle = '#fff';
      ctx.font = '300 40px sans-serif';
      ctx.fillText('Você foi chamado para a tribo de', W/2, 750);
      
      ctx.font = 'bold 80px sans-serif';
      ctx.fillText(String(inviterName || 'Viva360').toUpperCase().slice(0, 18), W/2, 850);

      // Quote Area
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.roundRect(W/2 - 400, 950, 800, 250, 40);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'italic 45px serif';
      ctx.fillText('"A evolução é mais leve', W/2, 1040);
      ctx.fillText('quando compartilhada."', W/2, 1110);

      // CTA Button Visual
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#fbbf24';
      ctx.roundRect(W/2 - 300, 1350, 600, 140, 70);
      ctx.fill();
      ctx.shadowColor = "transparent";
      
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 45px sans-serif';
      ctx.fillText('ACEITAR CHAMADO', W/2, 1435);
      
      // Footer
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '30px monospace';
      ctx.fillText(inviteLink, W/2, 1600);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('VIVA360', W/2, 1750);

      setInviteImage(canvas.toDataURL());
  };

  const shareInvite = async (platform: 'whatsapp' | 'generic') => {
      if (!canvasRef.current) return;
      
      try {
          const blob = dataUrlToBlob(canvasRef.current.toDataURL());
          await shareToSocial(blob, {
              title: 'Convite Tribo Viva360',
              text: INVITE_TEXT,
              url: inviteLink,
              platform: platform === 'whatsapp' ? 'whatsapp' : 'generic',
              filename: 'convite-viva360.jpg',
          });
      } catch (e) {
          console.error(e);
          notify('Erro no Compartilhamento', 'Tente copiar o link manualmente.', 'error');
      }
  };

  /* Actions */
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
               <img src={inviteImage} className="w-full h-full object-cover" alt="Convite Viva360" />
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
               <button onClick={() => { 
                   navigator.clipboard.writeText(inviteLink); 
                   notify('Link Copiado', 'Espalhe a luz com sua tribo.', 'success');
                }} className="py-4 bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest active:scale-95 transition-all w-full">
                   <Copy size={18} /> Copiar
               </button>
           </div>
       </div>
    </div>
  );
}
