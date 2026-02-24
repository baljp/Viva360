import React from 'react';
import { CheckCircle, Download, Share2, Sparkles, X, Heart } from 'lucide-react';

export type MetamorphosisProcessingStyling = { glow: string; color: string; element: string };

export const MetamorphosisProcessingStep: React.FC<{
  styling: MetamorphosisProcessingStyling;
  onContinueNow: () => void;
  onCancel: () => void;
}> = ({ styling, onContinueNow, onCancel }) => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${styling.glow} opacity-30`}></div>
      <div className="w-24 h-24 rounded-full border border-nature-100 flex items-center justify-center animate-spin-slow">
        <Sparkles size={32} className={styling.color} />
      </div>
    </div>
    <h3 className="font-serif italic text-xl text-nature-700 mt-10">Sintonizando com {styling.element}...</h3>
    <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-black mt-4 animate-pulse">Codificando Essência</p>
    <button onClick={onContinueNow} className="mt-8 px-5 py-3 rounded-2xl border border-nature-200 bg-white text-[10px] font-bold uppercase tracking-widest text-nature-500 hover:bg-nature-50 transition-all">
      Continuar agora
    </button>
    <button onClick={onCancel} className="mt-4 text-nature-400 text-[10px] font-bold uppercase tracking-widest hover:text-rose-500 transition-colors">
      <X size={14} className="inline mr-1 -mt-0.5" />Cancelar Ritual
    </button>
  </div>
);

export const MetamorphosisShareControls: React.FC<{
  format: 'STORY' | 'POST';
  setFormat: (value: 'STORY' | 'POST') => void;
  isDrawing: boolean;
  onShare: () => void;
  onDownload: () => void;
  onComplete: () => void;
  onCancel: () => void;
}> = ({ format, setFormat, isDrawing, onShare, onDownload, onComplete, onCancel }) => (
  <>
    <div className="flex gap-2 mt-8 mb-6 w-full px-4">
      {(['STORY', 'POST'] as const).map((f) => (
        <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${format === f ? 'bg-indigo-900 text-white' : 'bg-white text-indigo-400'}`}>
          {f === 'STORY' ? '9:16 Story' : '4:5 Feed'}
        </button>
      ))}
    </div>

    <div className="w-full grid grid-cols-2 gap-4 px-4">
      <button onClick={onShare} disabled={isDrawing} className="col-span-2 py-5 bg-nature-900 text-white rounded-[2rem] flex items-center justify-center gap-3 font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
        {isDrawing ? <Sparkles size={18} className="animate-spin" /> : <Share2 size={18} />}
        {isDrawing ? 'Preparando Card...' : 'Viralizar Jornada'}
      </button>
      <button onClick={onDownload} className="py-4 bg-white border border-nature-100 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-[9px] tracking-widest text-nature-400 active:scale-95 transition-all">
        <Download size={16} /> Salvar HD
      </button>
      <button onClick={onComplete} className="py-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all">
        <CheckCircle size={16} /> Concluir Ritual
      </button>
      <button onClick={onCancel} className="col-span-2 py-3 text-nature-400 text-[10px] font-bold uppercase tracking-widest hover:text-rose-500 transition-colors">
        <X size={14} className="inline mr-1 -mt-0.5" />Cancelar Ritual
      </button>
    </div>
  </>
);

export const MetamorphosisSuccessStep: React.FC<{
  onOpenGrimoire: () => void;
  onBackToCore: () => void;
}> = ({ onOpenGrimoire, onBackToCore }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-1000">
    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 relative">
      <Heart size={48} className="text-rose-400 fill-rose-200 animate-pulse" />
      <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-full rotate-12 shadow-lg">
        <Sparkles size={16} />
      </div>
    </div>
    <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Esse dia foi guardado.</h2>
    <p className="text-nature-500 leading-relaxed mb-12">Sua travessia foi registrada com verdade. Sua história continua.</p>

    <div className="flex flex-col w-full gap-4">
      <button onClick={onOpenGrimoire} className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl">
        Ver Grimório de Cards
      </button>
      <button onClick={onBackToCore} className="w-full py-5 bg-nature-100 text-nature-600 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em]">
        Voltar ao Core
      </button>
    </div>
  </div>
);
