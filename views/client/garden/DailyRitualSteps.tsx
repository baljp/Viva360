import React from 'react';
import { ArrowRight, Download, Droplet, Sparkles, TrendingUp, X, Share2, CheckCircle2 } from 'lucide-react';
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
  previewUrl?: string | null;
  isSaving: boolean;
  onConfirm: () => void;
  format: 'STORY' | 'POST';
  setFormat: (format: 'STORY' | 'POST') => void;
  onShare: () => void;
  onDownload: () => void;
  onNurtureStart: () => void;
}> = ({ step, onClose, canvasRef, snapStub, previewUrl, isSaving, onConfirm, format, setFormat, onShare, onDownload, onNurtureStart }) => (
  <div className="fixed inset-0 z-[200] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(236,253,245,0.14),_transparent_28%),linear-gradient(180deg,_#07130f_0%,_#0d1715_45%,_#020617_100%)] text-white animate-in fade-in duration-500">
    <button onClick={onClose} className="absolute top-6 right-6 md:top-8 md:right-8 z-50 rounded-full border border-white/10 bg-white/8 p-4 text-white/80 backdrop-blur-xl transition-all active:scale-90 hover:bg-white/12">
      <X size={22} />
    </button>
    <canvas ref={canvasRef} style={{ display: 'none' }} />

    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-5 py-20 md:px-10 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <div className="mb-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-200/80">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 backdrop-blur-md">Registro do Dia</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">Pronto para feed e story</span>
        </div>

        <div className="mb-4 max-w-xl">
          <h2 className="text-4xl font-serif italic leading-tight text-white md:text-5xl">
            {step === 'CARD' ? 'Lapide sua presença antes de publicar.' : 'Sua memória visual já está pronta para circular.'}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/65 md:text-base">
            {step === 'CARD'
              ? 'A imagem já está harmonizada com o seu estado. Faça uma última leitura do card antes de cristalizar o momento no seu Jardim da Alma.'
              : 'Escolha o formato, salve em alta definição ou compartilhe direto. O card mantém o tom íntimo e aspiracional da plataforma.'}
          </p>
        </div>

        <div className="grid max-w-xl grid-cols-1 gap-3 text-sm text-white/70 sm:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">Estado</p>
            <p className="mt-2 text-base font-semibold text-white">{snapStub.mood || 'SERENO'}</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">Tratamento</p>
            <p className="mt-2 text-base font-semibold text-white">Editorial suave</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">Entrega</p>
            <p className="mt-2 text-base font-semibold text-white">Alta definição</p>
          </div>
        </div>

        {step === 'CARD' ? (
          <button onClick={onConfirm} disabled={isSaving} className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-white px-7 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-nature-950 shadow-[0_30px_80px_rgba(255,255,255,0.1)] transition-all active:scale-95 hover:shadow-[0_35px_90px_rgba(255,255,255,0.16)] disabled:opacity-60 md:w-auto">
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-nature-300 border-t-nature-900"></div>
                Salvando...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Cristalizar Momento
              </>
            )}
          </button>
        ) : (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="grid w-full max-w-xl grid-cols-2 gap-3 rounded-[2rem] border border-white/10 bg-white/6 p-2 backdrop-blur-xl">
              {(['STORY', 'POST'] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)} className={`rounded-[1.4rem] py-4 text-[10px] font-black uppercase tracking-[0.28em] transition-all ${format === f ? 'bg-white text-nature-950 shadow-lg' : 'bg-transparent text-white/55 hover:bg-white/5 hover:text-white'}`}>
                  {f === 'STORY' ? 'Story 9:16' : 'Feed 4:5'}
                </button>
              ))}
            </div>

            <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <button onClick={onShare} className="inline-flex items-center justify-center gap-3 rounded-[1.75rem] bg-emerald-400 px-7 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-nature-950 shadow-[0_24px_60px_rgba(16,185,129,0.28)] transition-all active:scale-95 hover:bg-emerald-300">
                <Share2 size={18} />
                Compartilhar Agora
              </button>
              <button onClick={onDownload} className="inline-flex items-center justify-center gap-2 rounded-[1.75rem] border border-white/10 bg-white/8 px-6 py-5 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-all active:scale-95 hover:bg-white/12">
                <Download size={18} />
                Salvar HD
              </button>
            </div>

            <button onClick={onNurtureStart} className="inline-flex w-full max-w-xl items-center justify-center gap-3 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/12 px-7 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-[0_20px_50px_rgba(16,185,129,0.12)] transition-all active:scale-95 hover:bg-emerald-300/18">
              <Droplet size={18} className="fill-current" />
              Nutrir Jardim da Alma
            </button>
          </div>
        )}
      </div>

      <div className="relative flex w-full max-w-[420px] flex-col items-center justify-center">
        <div className="absolute inset-x-10 top-10 h-48 rounded-full bg-emerald-300/20 blur-3xl"></div>
        <div className="relative w-full rounded-[2.5rem] border border-white/10 bg-white/7 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between rounded-[1.5rem] border border-white/8 bg-black/20 px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Prévia Viva360</p>
              <p className="mt-1 text-sm font-medium text-white/75">{step === 'CARD' ? 'Card-base do ritual' : 'Composição final de compartilhamento'}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              {format === 'STORY' ? '9:16' : '4:5'}
            </div>
          </div>

          {step === 'SHARE' && previewUrl ? (
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl">
              <img src={previewUrl} alt="Prévia final do ritual" className="h-auto w-full object-cover" />
            </div>
          ) : (
            <SoulCard snap={snapStub} className="shadow-2xl" />
          )}
        </div>

        <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
          Hoje eu cuidei de mim • Viva360
        </p>
      </div>
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
  <div className="fixed inset-0 z-[200] relative flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_24%),linear-gradient(180deg,_#03271d_0%,_#064e3b_45%,_#022c22_100%)]">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
    <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/12 blur-3xl"></div>
    <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full border border-white/8 opacity-40 animate-pulse"></div>

    <div className="relative z-10 flex flex-col items-center gap-8 animate-in slide-in-from-bottom duration-1000 px-6">
      <div className="relative animate-in animate-delay-100">
        <div className="absolute inset-0 scale-[1.4] rounded-full bg-emerald-200/10 blur-2xl animate-pulse" />
        <Droplet size={64} className="relative text-emerald-300 fill-emerald-300 animate-bounce" />
        <div className="absolute -bottom-12 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-emerald-500/50 blur-xl"></div>
      </div>

      <div className="space-y-3 text-center animate-in animate-delay-200">
        <div className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-emerald-100 backdrop-blur-xl">
          Ritual integrado ao Jardim
        </div>
        <h2 className="text-4xl font-serif italic text-white">Seu jardim recebeu cuidado hoje.</h2>
        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-[0.2em]">Sintonização Completa • Salvo na Evolução</p>
        <p className="mx-auto max-w-md text-sm leading-6 text-white/72">
          A imagem, a intenção e a gratidão agora formam um registro vivo da sua presença. Esse momento já conversa com a sua linha de evolução.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-2 animate-in animate-delay-300">
        <div className="rounded-full border border-white/10 bg-white/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md shadow-lg">+15 Vitalidade</div>
        <div className="rounded-full border border-white/10 bg-white/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md shadow-lg">+5 Karma</div>
        <div className="rounded-full border border-emerald-200/20 bg-emerald-100/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-emerald-50 backdrop-blur-md shadow-lg">Arquivo atualizado</div>
      </div>

      <div className="mt-2 grid w-full max-w-md grid-cols-3 gap-3 animate-in animate-delay-300">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 text-center backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Foto</p>
          <p className="mt-2 text-sm font-semibold text-white">Guardada</p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 text-center backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Intenção</p>
          <p className="mt-2 text-sm font-semibold text-white">Ancorada</p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 text-center backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Estado</p>
          <p className="mt-2 text-sm font-semibold text-white">Integrado</p>
        </div>
      </div>

      <div className="mt-2 flex w-full max-w-xs flex-col gap-3 animate-in animate-delay-300">
        <button onClick={() => { if (finalUser) updateUser(finalUser); else updateUser(user); goToEvolution(); }} className="w-full px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-full font-bold uppercase tracking-widest border border-white/20 shadow-xl hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-2">
          <TrendingUp size={16} /> Ver minha Evolução
        </button>
        <button onClick={() => { if (finalUser) updateUser(finalUser); else updateUser(user); onClose(); }} className="w-full px-8 py-4 bg-white text-emerald-900 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-2">
          <CheckCircle2 size={16} />
          Concluir
        </button>
      </div>

      <p className="text-center text-[10px] font-black uppercase tracking-[0.28em] text-white/35 animate-in animate-delay-300">
        Pequenos rituais, presença acumulada
      </p>
    </div>
  </div>
);
