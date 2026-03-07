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
  <div className="mt-8 w-full max-w-md space-y-4">
    <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-white/10 bg-white/6 p-2 backdrop-blur-xl">
      {(['STORY', 'POST'] as const).map((f) => (
        <button key={f} onClick={() => setFormat(f)} className={`rounded-[1.4rem] py-4 text-[10px] font-black uppercase tracking-[0.28em] transition-all ${format === f ? 'bg-white text-nature-950 shadow-lg' : 'bg-transparent text-white/55 hover:bg-white/5 hover:text-white'}`}>
          {f === 'STORY' ? 'Story 9:16' : 'Feed 4:5'}
        </button>
      ))}
    </div>

    <button onClick={onShare} disabled={isDrawing} className="inline-flex w-full items-center justify-center gap-3 rounded-[1.8rem] bg-emerald-400 px-6 py-5 text-[11px] font-black uppercase tracking-[0.32em] text-nature-950 shadow-[0_24px_60px_rgba(16,185,129,0.26)] transition-all active:scale-95 hover:bg-emerald-300 disabled:opacity-50">
      {isDrawing ? <Sparkles size={18} className="animate-spin" /> : <Share2 size={18} />}
      {isDrawing ? 'Preparando Card...' : 'Compartilhar Jornada'}
    </button>

    <div className="grid grid-cols-2 gap-3">
      <button onClick={onDownload} className="inline-flex items-center justify-center gap-2 rounded-[1.6rem] border border-white/10 bg-white/8 px-4 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-all active:scale-95 hover:bg-white/12">
        <Download size={16} /> Salvar HD
      </button>
      <button onClick={onComplete} className="inline-flex items-center justify-center gap-2 rounded-[1.6rem] bg-white px-4 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-nature-950 transition-all active:scale-95 hover:bg-emerald-50">
        <CheckCircle size={16} /> Concluir
      </button>
    </div>

    <button onClick={onCancel} className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-white/38 transition-colors hover:text-rose-300">
      <X size={14} className="mr-1 inline -mt-0.5" />Cancelar Ritual
    </button>
  </div>
);

export const MetamorphosisSuccessStep: React.FC<{
  onOpenGrimoire: () => void;
  onBackToCore: () => void;
}> = ({ onOpenGrimoire, onBackToCore }) => (
  <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center animate-in fade-in duration-1000 overflow-hidden">
    <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-rose-200/20 blur-3xl"></div>
    <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full border border-rose-100/40 opacity-50 animate-pulse"></div>

    <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 animate-in animate-delay-100">
      <Heart size={48} className="text-rose-400 fill-rose-200 animate-pulse" />
      <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-full rotate-12 shadow-lg">
        <Sparkles size={16} />
      </div>
    </div>

    <div className="space-y-3 animate-in animate-delay-200">
      <div className="inline-flex items-center rounded-full border border-nature-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-rose-500 shadow-sm">
        Metamorfose concluída
      </div>
      <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Esse dia foi guardado.</h2>
      <p className="mx-auto max-w-md text-nature-500 leading-relaxed mb-12">
        Sua travessia foi registrada com verdade. O card agora faz parte do seu repertório simbólico e pode ser compartilhado sem perder a intimidade do ritual.
      </p>
    </div>

    <div className="mb-8 grid w-full max-w-sm grid-cols-2 gap-3 animate-in animate-delay-300">
      <div className="rounded-[1.5rem] border border-nature-100 bg-white px-4 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-nature-400">Arquivo</p>
        <p className="mt-2 text-sm font-semibold text-nature-900">Grimório</p>
      </div>
      <div className="rounded-[1.5rem] border border-nature-100 bg-white px-4 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-nature-400">Status</p>
        <p className="mt-2 text-sm font-semibold text-nature-900">Memória ativa</p>
      </div>
    </div>

    <div className="mb-6 grid w-full max-w-md grid-cols-3 gap-3 animate-in animate-delay-300">
      <div className="rounded-[1.35rem] border border-nature-100 bg-white px-4 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-nature-400">Humor</p>
        <p className="mt-2 text-sm font-semibold text-nature-900">Lido</p>
      </div>
      <div className="rounded-[1.35rem] border border-nature-100 bg-white px-4 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-nature-400">Imagem</p>
        <p className="mt-2 text-sm font-semibold text-nature-900">Selada</p>
      </div>
      <div className="rounded-[1.35rem] border border-nature-100 bg-white px-4 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-nature-400">Card</p>
        <p className="mt-2 text-sm font-semibold text-nature-900">Ativo</p>
      </div>
    </div>

    <div className="flex w-full max-w-sm flex-col gap-4 animate-in animate-delay-300">
      <button onClick={onOpenGrimoire} className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] active:scale-95 transition-all">
        Ver Grimório de Cards
      </button>
      <button onClick={onBackToCore} className="w-full py-5 bg-nature-100 text-nature-600 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-nature-200 active:scale-95 transition-all">
        Voltar ao Core
      </button>
    </div>

    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-nature-300 animate-in animate-delay-300">
      presença registrada • pertencimento cultivado
    </p>
  </div>
);
