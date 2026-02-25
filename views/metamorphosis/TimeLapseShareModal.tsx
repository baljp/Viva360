import React from 'react';
import { Share2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onShare: (platform: 'whatsapp' | 'instagram' | 'download') => void;
  onClose: () => void;
};

export const TimeLapseShareModal: React.FC<Props> = ({ isOpen, onShare, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-300">
      <h3 className="text-3xl font-serif italic text-white mb-4 text-center">Sua História está Pronta! ✨</h3>
      <p className="text-white/60 text-sm mb-12 text-center max-w-xs">Reviva e compartilhe seus momentos de evolução.</p>

      <div className="space-y-3 w-full max-w-sm">
        <button onClick={() => onShare('whatsapp')} className="w-full py-5 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm">
          <Share2 size={20} /> Compartilhar no WhatsApp
        </button>
        <button onClick={() => onShare('instagram')} className="w-full py-5 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-400 text-white rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm">
          <Share2 size={20} /> Preparar para Instagram
        </button>
        <button onClick={() => onShare('download')} className="w-full py-5 bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
          Baixar Vídeo
        </button>
        <button onClick={onClose} className="w-full py-4 bg-transparent border border-white/20 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
          Voltar
        </button>
      </div>
    </div>
  );
};
