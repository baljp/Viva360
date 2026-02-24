import React from 'react';
import { ArrowRight, Download, Droplet, Sparkles, TrendingUp, X } from 'lucide-react';
import type { DailyRitualSnap, MoodType, User } from '../../../types';
import { SoulCard } from '../../../src/components/SoulCard';

type RitualData = { mood: MoodType; image: string; intention: string; gratitude: string };

export const DailyRitualIntentionStep: React.FC<{
  data: RitualData;
  setData: React.Dispatch<React.SetStateAction<RitualData>>;
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
}> = ({ data, setData, onBack, onClose, onContinue }) => (
  <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col p-8 pt-16 animate-in slide-in-from-right overflow-y-auto">
    <button onClick={onBack} className="mb-6 bg-white p-4 rounded-full w-min shadow-sm active:scale-95 transition-all"><ArrowRight className="rotate-180 text-nature-900" size={20} /></button>
    <button onClick={onClose} className="absolute top-8 right-8 bg-white p-4 rounded-full shadow-sm text-nature-400 z-50 active:scale-90 transition-all"><X size={24} /></button>
    <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Qual pequena ação hoje pode tornar seu dia melhor?</h2>
    <textarea
      value={data.intention}
      onChange={(e) => setData({ ...data, intention: e.target.value })}
      placeholder="Ex: Respirar por 5 min, ouvir uma música..."
      className="w-full h-40 bg-white p-6 rounded-[2rem] border border-nature-100 outline-none text-lg text-nature-900 placeholder:text-nature-300 resize-none shadow-sm focus:ring-2 focus:ring-primary-100 transition-all"
    />
    <div className="mt-4 flex gap-2 flex-wrap">
      {['Beber água', 'Pausa de 5min', 'Elogiar alguém'].map((s) => (
        <button key={s} onClick={() => setData({ ...data, intention: s })} className="px-4 py-2 bg-white rounded-full text-xs font-bold text-nature-500 border border-nature-100 hover:border-primary-300 active:bg-primary-50 transition-colors">
          {s}
        </button>
      ))}
    </div>
    <div className="mt-auto">
      <button onClick={onContinue} disabled={!data.intention} className="w-full py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all">
        Continuar
      </button>
    </div>
  </div>
);

export const DailyRitualGratitudeStep: React.FC<{
  data: RitualData;
  setData: React.Dispatch<React.SetStateAction<RitualData>>;
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
}> = ({ data, setData, onBack, onClose, onContinue }) => (
  <div className="fixed inset-0 z-[200] bg-emerald-50 flex flex-col p-8 pt-16 animate-in slide-in-from-right overflow-y-auto">
    <button onClick={onBack} className="mb-6 bg-white p-4 rounded-full w-min shadow-sm active:scale-95 transition-all"><ArrowRight className="rotate-180 text-nature-900" size={20} /></button>
    <button onClick={onClose} className="absolute top-8 right-8 bg-white p-4 rounded-full shadow-sm text-emerald-600 z-50 active:scale-90 transition-all"><X size={24} /></button>
    <h2 className="text-3xl font-serif italic text-nature-900 mb-4">Pelo que você é grato agora?</h2>
    <p className="text-nature-400 text-sm mb-6">A gratidão reprograma nossa vibração.</p>
    <textarea
      value={data.gratitude}
      onChange={(e) => setData({ ...data, gratitude: e.target.value })}
      placeholder="Sou grato por..."
      className="w-full h-40 bg-white p-6 rounded-[2rem] border border-emerald-100 outline-none text-lg text-nature-900 placeholder:text-nature-300 resize-none shadow-sm focus:ring-2 focus:ring-emerald-100 transition-all"
    />
    <div className="mt-auto">
      <button onClick={onContinue} disabled={!data.gratitude} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all">
        Gerar Card
      </button>
    </div>
  </div>
);

export const DailyRitualCardShareStep: React.FC<{
  step: 'CARD' | 'SHARE';
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  snapStub: DailyRitualSnap;
  isSaving: boolean;
  onConfirm: () => void;
  format: 'STORY' | 'POST';
  setFormat: (format: 'STORY' | 'POST') => void;
  onShare: () => void;
  onDownload: () => void;
  onNurtureStart: () => void;
}> = ({ step, onClose, canvasRef, snapStub, isSaving, onConfirm, format, setFormat, onShare, onDownload, onNurtureStart }) => (
  <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500 overflow-y-auto">
    <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-4 rounded-full text-white z-50 active:scale-90 transition-all"><X size={24} /></button>
    <canvas ref={canvasRef} style={{ display: 'none' }} />
    <div className="w-full max-w-sm relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-white/50 text-xs font-bold uppercase tracking-[0.3em] whitespace-nowrap">Sua Essência de Hoje</div>
      <SoulCard snap={snapStub} className="shadow-2xl skew-y-1 mb-8" />

      {step === 'CARD' ? (
        <button onClick={onConfirm} disabled={isSaving} className="w-full py-5 bg-white text-nature-900 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-nature-50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          {isSaving ? (
            <><div className="w-4 h-4 border-2 border-nature-300 border-t-nature-900 rounded-full animate-spin"></div> Salvando...</>
          ) : (
            <><Sparkles size={18} /> Cristalizar Momento</>
          )}
        </button>
      ) : (
        <div className="space-y-3 animate-in slide-in-from-bottom fade-in duration-500">
          <div className="flex gap-2 mb-6">
            {(['STORY', 'POST'] as const).map((f) => (
              <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${format === f ? 'bg-nature-900 text-white' : 'bg-nature-50 text-nature-400'}`}>
                {f === 'STORY' ? '9:16 Story' : '4:5 Feed'}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={onShare} className="flex-1 py-5 bg-nature-900 text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all">Compartilhar</button>
            <button onClick={onDownload} className="p-5 bg-nature-50 text-nature-900 rounded-3xl active:scale-95 transition-all"><Download size={20} /></button>
          </div>
          <button onClick={onNurtureStart} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Droplet size={18} className="fill-white" /> Nutrir Jardim da Alma
          </button>
          <p className="text-center text-white/40 text-[10px] uppercase tracking-widest mt-4">Hoje eu cuidei de mim 🌱 #Viva360</p>
        </div>
      )}
    </div>
  </div>
);

export const DailyRitualNurtureStep: React.FC<{
  finalUser: User | null;
  updateUser: (user: User) => void;
  user: User;
  onClose: () => void;
  goToEvolution: () => void;
}> = ({ finalUser, updateUser, user, onClose, goToEvolution }) => (
  <div className="fixed inset-0 z-[200] bg-emerald-900 flex flex-col items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>

    <div className="relative z-10 flex flex-col items-center gap-8 animate-in slide-in-from-bottom duration-1000">
      <div className="relative">
        <Droplet size={64} className="text-emerald-300 fill-emerald-300 animate-bounce" />
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500/50 rounded-full blur-xl"></div>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-serif italic text-white">Seu jardim recebeu cuidado hoje.</h2>
        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em]">Sintonização Completa • Salvo na Evolução</p>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest">+15 Vitalidade</div>
        <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest">+5 Karma</div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <button onClick={() => { if (finalUser) updateUser(finalUser); else updateUser(user); goToEvolution(); }} className="w-full px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-full font-bold uppercase tracking-widest border border-white/20 shadow-xl hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-2">
          <TrendingUp size={16} /> Ver minha Evolução
        </button>
        <button onClick={() => { if (finalUser) updateUser(finalUser); else updateUser(user); onClose(); }} className="w-full px-8 py-4 bg-white text-emerald-900 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
          Concluir
        </button>
      </div>
    </div>
  </div>
);
