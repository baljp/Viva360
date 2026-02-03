import React from 'react';
import { Sprout, Leaf, Flower, Sparkles, Trees, Wind, Droplets } from 'lucide-react';
import { User as UserType } from '../../types';
import { ICON_SIZE } from './constants';

export const SoulGarden: React.FC<{ user: UserType, onWater: () => void }> = ({ user, onWater }) => {
  const stageIcons = { seed: Sprout, sprout: Leaf, bud: Flower, flower: Sparkles, tree: Trees, withered: Wind };
  const Icon = stageIcons[user.plantStage || 'seed'];
  const stageLabels = { seed: 'Semente', sprout: 'Brotar', bud: 'Botão', flower: 'Florescer', tree: 'Árvore', withered: 'Renascimento' };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-nature-100 shadow-xl flex flex-col items-center text-center gap-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/30 rounded-bl-[80px] transition-transform group-hover:scale-110"></div>
      <div className="relative">
          <div className="absolute inset-0 bg-primary-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 relative z-10 border border-primary-100 shadow-inner group-hover:rotate-12 transition-transform duration-700">
            <Icon size={ICON_SIZE.XL} />
          </div>
      </div>
      <div className="space-y-1 relative z-10">
          <h3 className="text-lg font-serif italic text-nature-900">Jardim da Alma</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[8px] font-bold text-primary-700 uppercase tracking-widest">{stageLabels[user.plantStage || 'seed']}</span>
            <span className="w-1 h-1 bg-nature-200 rounded-full"></span>
            <span className="text-[8px] font-bold text-nature-400 uppercase tracking-widest">Nível {Math.floor((user.plantXp || 0) / 20) + 1}</span>
          </div>
      </div>
      <div className="w-full max-w-[140px] h-1.5 bg-nature-100 rounded-full overflow-hidden border border-nature-50 shadow-inner">
        <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-[2000ms]" style={{ width: `${(user.plantXp || 0) % 100}%` }}></div>
      </div>
      <button onClick={onWater} className="btn-primary w-full max-w-[180px] gap-2">
        <Droplets size={14} className="group-hover:animate-bounce" /> Regar Essência
      </button>
    </div>
  );
};
