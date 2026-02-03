import React from 'react';
import { CheckCheck, Activity, ChevronRight } from 'lucide-react';
import { DailyQuest } from '../../types';

export const DailyQuestsWidget: React.FC<{ quests: DailyQuest[], onComplete: (id: string) => void }> = ({ quests, onComplete }) => (
  <div className="space-y-3">
    {quests.map(q => (
      <button key={q.id} onClick={() => onComplete(q.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 group ${q.isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-nature-100 hover:border-primary-300'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${q.isCompleted ? 'bg-emerald-500 text-white' : 'bg-nature-50 text-nature-400'}`}>
            {q.isCompleted ? <CheckCheck size={24}/> : <Activity size={24}/>}
          </div>
          <div className="text-left">
            <h5 className="text-xs font-bold text-nature-900">{q.label}</h5>
            <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">+{q.reward} Karma</p>
          </div>
        </div>
        <ChevronRight size={16} className={q.isCompleted ? 'text-emerald-400' : 'text-nature-200'} />
      </button>
    ))}
  </div>
);
