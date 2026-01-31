import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { MessageSquare, Heart, Send, Flame, Droplet, Sprout, Wind, Eye, Zap, Handshake } from 'lucide-react';

const ENERGIES = [
    { id: 'vitality', label: 'Vitalidade', icon: Flame, color: 'text-amber-500', bg: 'bg-amber-50', msg: 'Envio fogo vital para fortalecer sua vontade! 🔥' },
    { id: 'calm', label: 'Calma', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-50', msg: 'Que a serenidade das águas te envolva. 💧' },
    { id: 'growth', label: 'Crescimento', icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-50', msg: 'Honro seu florescer. Continue crescendo! 🌱' },
    { id: 'lightness', label: 'Leveza', icon: Wind, color: 'text-sky-400', bg: 'bg-sky-50', msg: 'Solte o peso. Respire e flua com o vento. 🌬️' },
    { id: 'clarity', label: 'Clareza', icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-50', msg: 'Que a visão se abra e a verdade se revele. 👁️' },
    { id: 'love', label: 'Amor', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', msg: 'Um abraço de alma para alma. Estamos juntos. ❤️' },
];

interface Message {
    id: number;
    user: string;
    avatar: string;
    text: string;
    likes?: number;
    type: 'chat' | 'energy';
    energy?: string;
    mine: boolean;
}

export default function TribeInteraction() {
  const { go, back } = useBuscadorFlow();
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
     { id: 1, user: 'Lucas Paz', avatar: 'bg-indigo-100', text: 'Alguém sentiu a energia do portal de hoje? Foi intenso! ✨', likes: 5, type: 'chat', mine: false },
     { id: 2, user: 'Você', avatar: 'bg-emerald-100', text: 'Sim! A meditação guiada ajudou muito a ancorar.', likes: 0, type: 'chat', mine: true },
     { id: 3, user: 'Ana Luz', avatar: 'bg-rose-100', text: 'Enviou Vitalidade para o grupo.', type: 'energy', energy: 'vitality', mine: false }
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
      if (selectedEnergy) {
           const energy = ENERGIES.find(e => e.id === selectedEnergy);
           if (energy) {
               setMessages([...messages, { 
                   id: Date.now(), 
                   user: 'Você', 
                   avatar: 'bg-emerald-100', 
                   text: energy.msg, // Pre-defined msg
                   likes: 0, 
                   type: 'energy',
                   energy: energy.id,
                   mine: true 
               }]);
               setSelectedEnergy(null);
           }
      } else if (inputText.trim()) {
           setMessages([...messages, { 
               id: Date.now(), 
               user: 'Você', 
               avatar: 'bg-emerald-100', 
               text: inputText, 
               likes: 0, 
               type: 'chat', 
               mine: true 
           }]);
           setInputText("");
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white p-6 shadow-sm flex items-center gap-4 z-10 sticky top-0">
           <button onClick={back} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">←</button>
           <div className="flex-1">
               <h1 className="font-bold text-slate-900">Círculo de Cura</h1>
               <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 12 Guardiões Online</p>
           </div>
           <button onClick={() => go('SOUL_PACT')} className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-colors" title="Pactos">
              <Handshake size={20} />
           </button>
       </header>

       <div className="flex-1 p-6 overflow-y-auto space-y-6 pb-32">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex gap-4 ${msg.mine ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-10 h-10 rounded-full flex-shrink-0 ${msg.avatar}`}></div>
                 <div className={`${msg.mine ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-600 rounded-tl-none'} p-4 rounded-2xl shadow-sm max-w-[80%] break-words whitespace-pre-wrap`}>
                     {msg.type === 'energy' ? (
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center`}>
                                <Zap size={20} className={msg.mine ? 'text-amber-300' : 'text-amber-500'} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase opacity-70 block mb-1">Energia Enviada</span>
                                <p className="text-sm font-medium italic">"{msg.text}"</p>
                            </div>
                        </div>
                     ) : (
                        <>
                           {!msg.mine && <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{msg.user}</p>}
                           <p className="text-sm">{msg.text}</p>
                        </>
                     )}
                 </div>
             </div>
           ))}
       </div>

       <div className="p-4 bg-white border-t border-slate-100 fixed bottom-0 w-full pb-8">
           {/* Energy Selector */}
           <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
               {ENERGIES.map(e => (
                   <button 
                      key={e.id}
                      onClick={() => setSelectedEnergy(selectedEnergy === e.id ? null : e.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${selectedEnergy === e.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                   >
                       <e.icon size={16} className={selectedEnergy === e.id ? 'text-white' : e.color} />
                       <span className="text-xs font-bold whitespace-nowrap">{e.label}</span>
                   </button>
               ))}
           </div>

           <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 relative">
               <input 
                  type="text" 
                  value={selectedEnergy ? ENERGIES.find(e => e.id === selectedEnergy)?.msg : inputText}
                  onChange={e => !selectedEnergy && setInputText(e.target.value)}
                  readOnly={!!selectedEnergy}
                  placeholder="Compartilhe sua luz..." 
                  className={`flex-1 bg-transparent border-none outline-none px-4 text-sm ${selectedEnergy ? 'text-indigo-600 font-medium italic' : ''}`} 
               />
               <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={18}/></button>
           </div>
       </div>
    </div>
  );
}
