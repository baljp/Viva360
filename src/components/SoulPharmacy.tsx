
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Heart, Star, Clock, ShoppingCart, Sparkles, CheckCircle2, Filter, X } from 'lucide-react';
import { User } from '../types';
import { Card, DynamicAvatar } from './Common';
import { api } from '../services/api';

interface SoulPill {
  id: string;
  title: string;
  description: string;
  type: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  targetMoods: string[];
  price: number;
  isFree: boolean;
  avgRating: number;
  purchases: number;
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface SoulPharmacyProps {
  user: User;
  currentMood?: string;
  onClose: () => void;
  onPurchase: (pill: SoulPill) => void;
}

const MOOD_COLORS: Record<string, string> = {
  SERENO: 'bg-emerald-100 text-emerald-700',
  VIBRANTE: 'bg-amber-100 text-amber-700',
  MELANCÓLICO: 'bg-indigo-100 text-indigo-700',
  ANSIOSO: 'bg-rose-100 text-rose-700',
  FOCADO: 'bg-blue-100 text-blue-700',
  EXAUSTO: 'bg-purple-100 text-purple-700',
  GRATO: 'bg-pink-100 text-pink-700',
};

const TYPE_LABELS: Record<string, string> = {
  AUDIO: '🎧 Áudio',
  VIDEO: '🎬 Vídeo',
  TEXT: '📖 Texto',
  GUIDED_MEDITATION: '🧘 Meditação',
  COURSE: '📚 Curso',
};

export const SoulPharmacy: React.FC<SoulPharmacyProps> = ({ user, currentMood, onClose, onPurchase }) => {
  const [pills, setPills] = useState<SoulPill[]>([]);
  const [suggestions, setSuggestions] = useState<SoulPill[]>([]);
  const [selectedPill, setSelectedPill] = useState<SoulPill | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load from API
  useEffect(() => {
    const loadPills = async () => {
      try {
        setIsLoading(true);
        // Load suggestions if mood exists
        if (currentMood) {
            const suggData = await api.soulPharmacy.listPills(currentMood);
            setSuggestions(suggData.data || []);
        }

        // Load all pills
        const allData = await api.soulPharmacy.listPills();
        setPills(allData.data || []);
      } catch (error) {
        console.error("Failed to load soul pills", error);
        // Fallback or error toast could go here
      } finally {
        setIsLoading(false);
      }
    };

    loadPills();
  }, [currentMood]);

  const filteredPills = filter === 'all' 
    ? pills 
    : filter === 'free' 
      ? pills.filter(p => p.isFree)
      : pills.filter(p => p.targetMoods.includes(filter));

  // Pill Detail Modal
  if (selectedPill) {
    // ... Detail Modal implementation (kept mostly same, simplified for clarity here)
    return (
      <div className="fixed inset-0 z-[250] bg-nature-50 flex flex-col animate-in slide-in-from-bottom">
         {/* ... implementation same as before ... */}
         {/* Hero Image */}
        <div className="relative h-72">
          <img 
            src={selectedPill.thumbnailUrl || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800'} 
            alt={selectedPill.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nature-900/80 to-transparent" />
          <button 
            onClick={() => setSelectedPill(null)}
            className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white"
          >
            <ChevronLeft size={24} />
          </button>
          
          <span className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold">
            {TYPE_LABELS[selectedPill.type] || selectedPill.type}
          </span>
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl font-serif italic text-white mb-2">{selectedPill.title}</h2>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <div className="flex items-center gap-1">
                <Star size={14} fill="currentColor" className="text-amber-400" />
                <span>{selectedPill.avgRating?.toFixed(1) || '5.0'}</span>
              </div>
              {selectedPill.duration && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{selectedPill.duration} min</span>
                </div>
              )}
              <span>{selectedPill.purchases || 0} pessoas</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32">
          <div className="flex items-center gap-3 mb-6">
            <DynamicAvatar user={{ name: selectedPill.creator?.name || 'Viva360', avatar: selectedPill.creator?.avatar }} size="md" />
            <div>
              <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest">Criado por</p>
              <p className="font-bold text-nature-900">{selectedPill.creator?.name || 'Viva360'}</p>
            </div>
          </div>

          <p className="text-nature-600 leading-relaxed mb-6">{selectedPill.description}</p>

          <div className="mb-6">
            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mb-3">Recomendado para</p>
            <div className="flex flex-wrap gap-2">
              {selectedPill.targetMoods?.map(mood => (
                <span key={mood} className={`px-3 py-1 rounded-full text-xs font-bold ${MOOD_COLORS[mood] || 'bg-nature-100 text-nature-600'}`}>
                  {mood}
                </span>
              ))}
            </div>
          </div>

          {(selectedPill.type === 'AUDIO' || selectedPill.type === 'VIDEO' || selectedPill.type === 'GUIDED_MEDITATION') && (
            <Card className="p-6 text-center mb-6">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-20 h-20 bg-nature-900 text-white rounded-full flex items-center justify-center mx-auto shadow-xl active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-4">
                {selectedPill.isFree ? 'REPRODUZIR' : 'PRÉVIA GRATUITA'}
              </p>
            </Card>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-nature-100 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => onPurchase(selectedPill)}
            className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            {selectedPill.isFree ? (
              <>
                <CheckCircle2 size={18} />
                Acessar Gratuitamente
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                Adquirir por R$ {selectedPill.price.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Browse View
  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      <header className="flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
        <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="text-xl font-serif italic text-nature-900">Farmácia da Alma</h2>
          <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">PÍLULAS DE CURA</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {suggestions.length > 0 && currentMood && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-primary-500" />
              <h3 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">
                Para seu humor: {currentMood}
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
              {suggestions.map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedPill(pill)}
                  className="flex-shrink-0 w-48 bg-white rounded-[2rem] border border-primary-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-28 relative">
                    <img src={pill.thumbnailUrl || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'} className="w-full h-full object-cover" alt={pill.title} />
                    {pill.isFree && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[8px] font-bold rounded-full uppercase">
                        Grátis
                      </span>
                    )}
                  </div>
                  <div className="p-4 text-left">
                    <h4 className="font-bold text-sm text-nature-900 line-clamp-2">{pill.title}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs text-nature-400">
                      <Star size={12} fill="currentColor" className="text-amber-400" />
                      <span>{pill.avgRating?.toFixed(1) || '5.0'}</span>
                      <span>•</span>
                      <span>{pill.duration} min</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-6 px-6">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'free', label: 'Grátis' },
            { id: 'ANSIOSO', label: 'Ansiedade' },
            { id: 'SERENO', label: 'Serenidade' },
            { id: 'FOCADO', label: 'Foco' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-nature-900 text-white'
                  : 'bg-white border border-nature-200 text-nature-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse" />
            ))
          ) : (
            filteredPills.map(pill => (
              <button
                key={pill.id}
                onClick={() => setSelectedPill(pill)}
                className="w-full bg-white p-4 rounded-[2rem] border border-nature-100 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={pill.thumbnailUrl || 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400'} className="w-full h-full object-cover" alt={pill.title} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h4 className="font-bold text-nature-900 line-clamp-1">{pill.title}</h4>
                  <p className="text-[10px] text-nature-400 mt-1">{TYPE_LABELS[pill.type] || pill.type} • {pill.duration} min</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} fill="currentColor" className="text-amber-400" />
                      <span className="text-nature-600">{pill.avgRating?.toFixed(1) || '5.0'}</span>
                    </div>
                    {pill.isFree ? (
                      <span className="text-[10px] font-bold text-emerald-600">GRÁTIS</span>
                    ) : (
                      <span className="text-[10px] font-bold text-primary-600">R$ {pill.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 text-nature-300" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SoulPharmacy;
