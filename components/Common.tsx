
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, X, Droplets, Heart, Sparkles, Activity, CheckCircle2, ShieldCheck, 
  ChevronRight, Sprout, Leaf, Flower, Trees, Wind, Music, Calendar, Bell, 
  CheckCheck, Zap, Trophy, TrendingUp, Flame, Smile, Frown, Meh, CloudRain, Star, Upload, Image as ImageIcon, MessageSquare, Tag, Briefcase, Camera, Wallet, AlertCircle, Check, Package, Cloud, Plus
} from 'lucide-react';
import { User as UserType, UserRole, PlantStage, MoodType, DailyQuest, Notification, Badge, Appointment, Review, Product } from '../types';
import { api } from '../services/api';
import { getDailyMessage } from '../src/utils/dailyWisdom';

// --- LOGO COMPONENT ---
export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' | 'splash', className?: string, animated?: boolean }> = ({ size = 'md', className = "", animated = false }) => {
  const [error, setError] = useState(false);
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
    splash: 'w-48 h-48'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {animated && (
        <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-3xl animate-breathe"></div>
      )}
      {!error ? (
        <img 
          src="/logo.png" 
          alt="Viva360 Logo" 
          crossOrigin="anonymous"
          onError={() => setError(true)}
          className={`w-full h-full object-contain relative z-10 ${animated ? 'animate-breathe' : ''}`}
        />
      ) : (
        <div className="bg-nature-900 rounded-full w-full h-full flex items-center justify-center opacity-20">
            <Sparkles size={size === 'sm' ? 12 : 24} className="text-white" />
        </div>
      )}
    </div>
  );
};

// --- AURORA BACKGROUND ---
export const AuroraBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary-100/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-100/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
    <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-indigo-100/10 rounded-full blur-[80px] animate-pulse delay-1000"></div>
  </div>
);

// --- STAR RATING ---
export const StarRating: React.FC<{ rating: number, onRate?: (r: number) => void, size?: number, interactive?: boolean }> = ({ rating, onRate, size = 16, interactive = false }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star} 
                    onClick={() => interactive && onRate && onRate(star)}
                    className={`${interactive ? 'cursor-pointer active:scale-110 transition-transform' : 'cursor-default'}`}
                    disabled={!interactive}
                >
                    <Star 
                        size={size} 
                        className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-nature-200 fill-nature-100'}`} 
                    />
                </button>
            ))}
        </div>
    );
};

// --- REVIEW CARD ---
export const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <img 
                    src={review.authorAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${review.authorName}`} 
                    crossOrigin="anonymous"
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${review.authorName}`; }}
                    className="w-10 h-10 rounded-full border border-nature-200 object-cover" 
                />
                <div>
                    <p className="text-xs font-bold text-nature-900">{review.authorName}</p>
                    <p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(review.date).toLocaleDateString()}</p>
                </div>
            </div>
            <StarRating rating={review.rating} size={12} />
        </div>
        <p className="text-xs text-nature-600 italic leading-relaxed">"{review.comment}"</p>
        {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
                {review.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-nature-50 text-nature-500 rounded-lg text-[8px] font-bold uppercase tracking-wider border border-nature-100">
                        {tag}
                    </span>
                ))}
            </div>
        )}
    </div>
);

// --- REVIEW FORM MODAL ---
export const ReviewFormModal: React.FC<{ isOpen: boolean, onClose: () => void, targetName: string, onSubmit: (rating: number, comment: string, tags: string[]) => void }> = ({ isOpen, onClose, targetName, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    const availableTags = ['Empático', 'Pontual', 'Ambiente Zen', 'Transformador', 'Mãos de Fada', 'Profissional', 'Acolhedor', 'Técnico'];

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit(rating, comment, selectedTags);
        onClose();
        // Reset form
        setRating(0);
        setComment('');
        setSelectedTags([]);
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Avaliar Experiência">
            <div className="space-y-8 pb-8 text-center">
                <div className="space-y-2">
                    <p className="text-sm text-nature-500">Como foi sua conexão com <strong className="text-nature-900">{targetName}</strong>?</p>
                    <div className="flex justify-center py-4">
                        <StarRating rating={rating} onRate={setRating} size={40} interactive />
                    </div>
                    {rating > 0 && <p className="text-xs font-bold text-amber-500 uppercase tracking-widest animate-in fade-in">{rating === 5 ? 'Experiência Divina' : rating >= 4 ? 'Muito Bom' : rating === 3 ? 'Equilibrado' : 'Pode Melhorar'}</p>}
                </div>

                <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><Tag size={12}/> O que mais marcou?</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => toggleTag(tag)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedTags.includes(tag) ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-500 border-nature-100 hover:border-nature-300'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><MessageSquare size={12}/> Deixe um comentário</label>
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Compartilhe como você se sentiu..."
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-100 resize-none h-32"
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="w-full py-5 bg-primary-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    Enviar Avaliação
                </button>
            </div>
        </BottomSheet>
    );
};

// --- PRODUCT FORM MODAL (MARKETPLACE MGMT) ---
export const ProductFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSubmit: (p: Omit<Product, 'id'>) => void }> = ({ isOpen, onClose, onSubmit }) => {
    const [type, setType] = useState<'physical' | 'digital_content' | 'workshop' | 'event'>('physical');
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=400');
    const [eventDate, setEventDate] = useState('');
    const [symptomInput, setSymptomInput] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);

    const handleSubmit = () => {
        if (!name || price <= 0) return;
        onSubmit({
            name, price, image, category, type, description, 
            eventDate: (type === 'event' || type === 'workshop') ? eventDate : undefined,
            symptoms,
            karmaReward: Math.floor(price * 0.5),
            spotsLeft: (type === 'event' || type === 'workshop') ? 20 : undefined
        });
        // Reset
        setName(''); setPrice(0); setCategory(''); setDescription(''); setSymptoms([]);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Novo Item no Bazar">
            <div className="space-y-6 pb-12">
                {/* Tipo de Produto */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'physical', label: 'Físico', icon: Package },
                        { id: 'workshop', label: 'Workshop', icon: Sparkles },
                        { id: 'event', label: 'Evento/Festa', icon: Music },
                        { id: 'digital_content', label: 'Digital', icon: Cloud }
                    ].map(t => (
                        <button key={t.id} onClick={() => setType(t.id as any)} className={`px-4 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 ${type === t.id ? 'bg-nature-900 text-white border-nature-900 shadow-lg' : 'bg-white text-nature-400 border-nature-100'}`}>
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Nome do Produto/Evento</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cristal de Ametista ou Workshop de Breathwork" className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Preço (R$)</label>
                            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Categoria</label>
                            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Pedras, Cura" className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                        </div>
                    </div>

                    {(type === 'event' || type === 'workshop') && (
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Data do Encontro</label>
                            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Indicações / Sintomas</label>
                        <div className="flex gap-2">
                             <input value={symptomInput} onChange={e => setSymptomInput(e.target.value)} placeholder="Ex: Ansiedade" className="flex-1 bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none" />
                             <button onClick={() => { if(symptomInput) { setSymptoms([...symptoms, symptomInput]); setSymptomInput(''); } }} className="p-4 bg-primary-900 text-white rounded-2xl active:scale-90 transition-transform"><Plus size={20}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {symptoms.map(s => <span key={s} className="px-3 py-1 bg-white border border-nature-100 rounded-full text-[10px] font-bold text-nature-500 uppercase flex items-center gap-2">{s} <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))}><X size={10}/></button></span>)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Manifesto (Descrição)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descreva a energia deste item..." className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none resize-none" />
                    </div>
                </div>

                <button onClick={handleSubmit} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Lançar no Ecossistema</button>
            </div>
        </BottomSheet>
    );
};

// --- VACANCY FORM MODAL ---
export const VacancyFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSubmit: (title: string, description: string, specialties: string[]) => void }> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [specialtyInput, setSpecialtyInput] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);

    const handleAddSpecialty = () => {
        if (specialtyInput.trim()) {
            setSpecialties([...specialties, specialtyInput.trim()]);
            setSpecialtyInput('');
        }
    };

    const handleRemoveSpecialty = (spec: string) => {
        setSpecialties(specialties.filter(s => s !== spec));
    };

    const handleSubmit = () => {
        if (!title || !description) return;
        onSubmit(title, description, specialties);
        onClose();
        setTitle('');
        setDescription('');
        setSpecialties([]);
        setSpecialtyInput('');
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Nova Oportunidade">
            <div className="space-y-6 pb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Título da Vaga</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Terapeuta Ayurveda"
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Descrição da Função</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o que o Guardião irá realizar..."
                        className="w-full bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none h-24"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Especialidades Requeridas</label>
                    <div className="flex gap-2">
                        <input 
                            value={specialtyInput}
                            onChange={(e) => setSpecialtyInput(e.target.value)}
                            placeholder="Adicionar (ex: Reiki)"
                            className="flex-1 bg-nature-50 border border-nature-100 p-4 rounded-2xl text-sm outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialty()}
                        />
                        <button onClick={handleAddSpecialty} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><PlusIcon size={20} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {specialties.map(s => (
                            <span key={s} className="px-3 py-1 bg-white border border-nature-100 rounded-xl text-xs flex items-center gap-2">
                                {s} <button onClick={() => handleRemoveSpecialty(s)}><X size={12} className="text-nature-400" /></button>
                            </span>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={!title || !description}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                    Publicar Vaga
                </button>
            </div>
        </BottomSheet>
    );
};

// Helper icon component for internal use
const PlusIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

// --- DYNAMIC AVATAR ---
// --- DYNAMIC AVATAR ---
export const DynamicAvatar: React.FC<{ user: Partial<UserType>, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }> = ({ user, size = 'md', className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-20 h-20', xl: 'w-32 h-32' };
  
  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden border-2 border-white shadow-sm bg-nature-100 flex-none relative flex items-center justify-center`}>
      {!imgError ? (
          <img 
            src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name || 'user'}`} 
            loading="lazy" 
            crossOrigin="anonymous"
            className="w-full h-full object-cover" 
            alt={user.name} 
            onError={() => setImgError(true)}
          />
      ) : (
          <div className="w-full h-full bg-nature-200 flex items-center justify-center text-nature-400">
             <span className="font-serif italic font-bold text-lg">{user.name?.charAt(0) || 'U'}</span>
          </div>
      )}
    </div>
  );
};

// --- MOOD TRACKER (NOVO) ---
export const MoodTracker: React.FC<{ currentMood?: MoodType, onSelect: (m: MoodType) => void }> = ({ currentMood, onSelect }) => {
    const moods: { type: MoodType, icon: any, color: string }[] = [
        { type: 'SERENO', icon: Wind, color: 'bg-emerald-100 text-emerald-600' },
        { type: 'VIBRANTE', icon: Sun, color: 'bg-amber-100 text-amber-600' },
        { type: 'FOCADO', icon: Zap, color: 'bg-indigo-100 text-indigo-600' },
        { type: 'MELANCÓLICO', icon: CloudRain, color: 'bg-blue-100 text-blue-600' },
        { type: 'EXAUSTO', icon: Frown, color: 'bg-stone-100 text-stone-600' },
        { type: 'ANSIOSO', icon: Activity, color: 'bg-rose-100 text-rose-600' },
    ];

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
            <h4 className="font-bold text-nature-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} className="text-primary-500" /> Como está sua energia?
            </h4>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {moods.map(m => (
                    <button 
                        key={m.type}
                        onClick={() => onSelect(m.type)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all min-w-[70px] ${currentMood === m.type ? 'scale-110 ring-2 ring-primary-200 bg-nature-50' : 'opacity-70 hover:opacity-100'}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${m.color}`}>
                            <m.icon size={24} />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-nature-400">{m.type}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- ZEN TOAST ---
// --- ZEN TOAST ---
export const ZenToast: React.FC<{ toast: { title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning' }, onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  
  const typeConfig = {
      success: { bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 },
      error: { bg: 'bg-rose-50 border-rose-100', iconBg: 'bg-rose-100 text-rose-600', icon: AlertCircle },
      warning: { bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100 text-amber-600', icon: AlertCircle },
      info: { bg: 'bg-white/90 border-white', iconBg: 'bg-primary-50 text-primary-600', icon: Sparkles }
  };

  const config = typeConfig[toast.type || 'info'];
  const Icon = config.icon;

  return (
    <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm animate-in slide-in-from-top duration-500">
      <div className={`${config.bg} backdrop-blur-xl border p-6 rounded-[2rem] shadow-2xl flex items-start gap-4`}>
        <div className={`w-10 h-10 ${config.iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
             <Icon size={20} className="animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="font-serif italic text-nature-900 leading-tight">{toast.title}</h4>
          <p className="text-xs text-nature-500 mt-1">{toast.message}</p>
        </div>
        <button onClick={onClose} className="text-nature-300 p-1"><X size={16}/></button>
      </div>
    </div>
  );
};

// --- PORTAL VIEW (LAYOUT WRAPPER) ---
export const PortalView: React.FC<{ 
    title: string, 
    subtitle: string, 
    onBack?: () => void, 
    onClose?: () => void,
    children: React.ReactNode, 
    footer?: React.ReactNode,
    headerRight?: React.ReactNode,
    heroImage?: string
}> = ({ title, subtitle, onBack, onClose, children, footer, headerRight, heroImage }) => (
    <div className="fixed inset-0 z-[150] flex flex-col bg-nature-50 animate-in slide-in-from-right duration-300 h-full w-[100vw]">
        <header className={`flex-none flex items-center justify-between px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 z-20 transition-colors ${heroImage ? 'bg-transparent text-white fixed top-0 w-full' : 'bg-white border-b border-nature-100 shadow-sm relative'}`}>
            <div className="flex items-center gap-4">
                {onBack && (
                    <button onClick={onBack} className={`p-3 rounded-2xl active:scale-90 transition-all shadow-sm ${heroImage ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-nature-50 text-nature-600'}`}>
                        <ChevronRight className="rotate-180" size={22} />
                    </button>
                )}
                <div className="space-y-0.5">
                    <h2 className={`text-xl font-serif italic leading-none ${heroImage ? 'text-white drop-shadow-md' : 'text-nature-900'}`}>{title}</h2>
                    <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${heroImage ? 'text-white/80 drop-shadow-sm' : 'text-nature-400'}`}>{subtitle}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {headerRight}
                {onClose && (
                    <button onClick={onClose} className={`p-3 rounded-2xl active:scale-90 transition-all shadow-sm ${heroImage ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-rose-50 text-rose-400'}`}>
                        <X size={22} />
                    </button>
                )}
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(6rem+env(safe-area-inset-bottom))] overscroll-contain relative">
            {heroImage && (
                <div className="w-full h-72 relative shrink-0">
                    <img 
                        src={heroImage} 
                        crossOrigin="anonymous"
                        onError={(e) => { 
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800';
                        }}
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-nature-50/20"></div>
                </div>
            )}
            <div className={`flex flex-col ${heroImage ? '-mt-12 relative z-10 bg-nature-50 rounded-t-[2.5rem] min-h-[50vh] p-6 shadow-2xl border-t border-white/20' : 'p-6'}`}>
                {children}
            </div>
        </div>
        
        {footer && <div className="flex-none bg-white border-t border-nature-100 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative z-30">
            {footer}
        </div>}
    </div>
);

// --- PORTAL CARD ---
export const PortalCard: React.FC<{ id?: string, title: string, subtitle: string, icon: React.FC<any>, bgImage: string, onClick: () => void, delay?: number }> = ({ id, title, subtitle, icon: Icon, bgImage, onClick, delay = 0 }) => (
  <button id={id} onClick={onClick} style={{ animationDelay: `${delay}ms` }} className="relative aspect-square rounded-[2.5rem] overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-up">
    <img 
        src={bgImage} 
        loading="lazy" 
        crossOrigin="anonymous"
        onError={(e) => { 
            e.currentTarget.src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800';
        }}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        alt={title} 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-nature-900/90 via-nature-900/40 to-transparent group-hover:from-primary-900/90 transition-colors"></div>
    <div className="absolute inset-0 p-6 flex flex-col justify-end text-left">
      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-3 group-hover:bg-white/20 transition-all"><Icon size={20} /></div>
      <p className="text-[8px] font-bold text-white/60 uppercase tracking-[0.3em] mb-1">{subtitle}</p>
      <h3 className="text-lg font-serif italic text-white leading-tight">{title}</h3>
    </div>
  </button>
);

import { getDailyWisdom } from '../src/utils/dailyWisdom';

// --- DAILY BLESSING (CHECK-IN) ---
export const DailyBlessing: React.FC<{ user: UserType, onCheckIn: (reward: number) => void }> = ({ user, onCheckIn }) => {
    const [dismissed, setDismissed] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const lastCheckInDate = user.lastCheckIn ? user.lastCheckIn.split('T')[0] : null;
    
    // Deterministic wisdom for today
    const wisdom = getDailyWisdom(user.id, user.karma);

    if (lastCheckInDate === today || dismissed) return null;

    return (
        <div className="fixed inset-x-0 top-0 z-[400] flex items-start justify-center p-4 pointer-events-none animate-in slide-in-from-top-4 duration-700">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl relative border border-white pointer-events-auto overflow-hidden group">
                {/* Rarity Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 ${wisdom.rarity === 'Legendary' ? 'bg-amber-400' : wisdom.rarity === 'Epic' ? 'bg-indigo-400' : 'bg-primary-400'}`}></div>
                
                <button onClick={() => setDismissed(true)} className="absolute top-4 right-4 p-2 text-nature-300 hover:text-nature-900 transition-colors z-20"><X size={16}/></button>
                
                <div className="flex items-center gap-5 relative z-10">
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${wisdom.rarity === 'Legendary' ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                            <Sun size={32} className="animate-spin-slow" />
                        </div>
                        {wisdom.rarity !== 'Common' && (
                             <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">{wisdom.rarity}</div>
                        )}
                    </div>
                    
                    <div className="flex-1 text-left">
                        <h3 className="text-lg font-serif italic text-nature-900 leading-tight">Benção Matinal</h3>
                        <p className={`text-[11px] leading-relaxed italic mt-1 font-medium ${wisdom.color}`}>"{wisdom.message}"</p>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-nature-400 uppercase tracking-widest leading-none mb-1">Oferenda de Hoje</span>
                        <span className="text-sm font-bold text-nature-900">+{wisdom.reward} Karma</span>
                    </div>
                    <button 
                        onClick={() => onCheckIn(wisdom.reward)} 
                        className="px-6 py-2.5 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-black"
                    >
                        Sintonizar Agora
                    </button>
                </div>
            </div>
        </div>
    );
}

export const SoulGarden: React.FC<{ user: UserType, onWater: () => void }> = ({ user, onWater }) => {
  const stageIcons = { seed: Sprout, sprout: Leaf, bud: Flower, flower: Sparkles, tree: Trees, withered: Wind };
  const Icon = stageIcons[user.plantStage || 'seed'];
  const stageLabels = { seed: 'Semente', sprout: 'Brotar', bud: 'Botão', flower: 'Florescer', tree: 'Árvore', withered: 'Renascimento' };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3.5rem] border border-nature-100 shadow-xl flex flex-col items-center text-center gap-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/30 rounded-bl-[120px] transition-transform group-hover:scale-110"></div>
      <div className="relative">
          <div className="absolute inset-0 bg-primary-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 relative z-10 border border-primary-100 shadow-inner group-hover:rotate-12 transition-transform duration-700">
            <Icon size={40} />
          </div>
      </div>
      <div className="space-y-1 relative z-10">
          <h3 className="text-xl font-serif italic text-nature-900">Jardim da Alma</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] font-bold text-primary-700 uppercase tracking-widest">{stageLabels[user.plantStage || 'seed']}</span>
            <span className="w-1 h-1 bg-nature-200 rounded-full"></span>
            <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Nível {Math.floor((user.plantXp || 0) / 20) + 1}</span>
          </div>
      </div>
      <div className="w-full max-w-[160px] h-2 bg-nature-100 rounded-full overflow-hidden border border-nature-200 shadow-inner">
        <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-[2000ms]" style={{ width: `${(user.plantXp || 0) % 100}%` }}></div>
      </div>
      <button onClick={onWater} className="px-6 py-3 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg group">
        <Droplets size={14} className="group-hover:animate-bounce" /> Regar Essência
      </button>
    </div>
  );
};

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

export const VerifiedBadge: React.FC<{ label: string, className?: string }> = ({ label, className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 ${className}`}>
    <ShieldCheck size={12} />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </div>
);

export const BottomSheet: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-t-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
        <div className="w-12 h-1.5 bg-nature-100 rounded-full mx-auto mb-6 flex-none"></div>
        <div className="flex justify-between items-center mb-8 flex-none">
          <h3 className="text-2xl font-serif italic text-nature-900">{title}</h3>
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-300"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
            {children}
        </div>
      </div>
    </div>
  );
};

export const CameraWidget: React.FC<{ onCapture: (img: string) => void, allowUpload?: boolean }> = ({ onCapture, allowUpload = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [camError, setCamError] = useState<string | null>(null);

  useEffect(() => { 
      let mediaStream: MediaStream | null = null;
      navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: { ideal: 'user' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 }
        } 
      })
        .then(stream => { 
            mediaStream = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
            }
            setCamError(null);
        })
        .catch(err => {
            console.error("Camera error:", err);
            setCamError("Não foi possível acessar a câmera. Verifique as permissões ou use o upload.");
        }); 

      return () => {
          if (mediaStream) {
              mediaStream.getTracks().forEach(track => track.stop());
          }
      };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      if (ctx) {
        // High Quality Settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Match UI aspect ratio or video resolution?
        // Let's use video resolution but ensure it's high
        const vW = videoRef.current.videoWidth;
        const vH = videoRef.current.videoHeight;
        canvasRef.current.width = vW; 
        canvasRef.current.height = vH;
        
        // Apply Instagram-style filters to the canvas context
        ctx.filter = 'contrast(1.06) saturate(1.15) brightness(1.02) sepia(0.02)';
        ctx.drawImage(videoRef.current, 0, 0, vW, vH); 
        
        // Add subtle vignette to capture
        const vignette = ctx.createRadialGradient(vW/2, vH/2, 0, vW/2, vH/2, Math.sqrt(vW**2 + vH**2)/2);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.8, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, vW, vH);
        
        // Stop stream immediately after capture
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Premium Quality JPEG
        onCapture(canvasRef.current.toDataURL('image/jpeg', 0.95));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) onCapture(ev.target.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-[3rem] overflow-hidden">
      {/* Viewport de Vídeo - Ocupa todo o espaço disponível MENOS a barra de controle */}
      <div className="flex-1 relative overflow-hidden bg-nature-900 flex items-center justify-center">
          {camError ? (
              <div className="px-8 text-center space-y-4">
                  <Camera size={48} className="mx-auto text-nature-300 opacity-50" />
                  <p className="text-sm text-nature-200">{camError}</p>
              </div>
          ) : (
              <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                  style={{ filter: 'contrast(1.06) saturate(1.15) brightness(1.02) sepia(0.02)' }}
              />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Aesthetic Overlays (Instagram Mode) */}
          {!camError && (
              <>
                {/* Vignette */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.2)_100%)]"></div>
                
                {/* Dreamy Glow */}
                <div className="absolute inset-0 pointer-events-none bg-indigo-500/5 mix-blend-screen opacity-30"></div>
                
                {/* Focus indicator */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                    <div className="w-64 h-64 border-2 border-white/30 rounded-[2.5rem] shadow-[0_0_20px_rgba(255,255,255,0.1)]"></div>
                </div>
              </>
          )}
      </div>
      
      {/* Barra de Controles Dedicada - Não sobreposta */}
      <div className="h-32 bg-nature-900/95 flex justify-between items-center px-12 border-t border-white/10 relative z-20 pb-4">
          <div className="w-12">
              {/* Espaço para balancear o layout */}
          </div>

          {/* Botão Capturar Principal */}
          <button onClick={capture} className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1.5 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <div className="w-full h-full bg-white rounded-full border-4 border-nature-900"></div>
          </button>

          {/* Botão Upload */}
          <div className="w-12 flex justify-center">
              {allowUpload && (
                  <>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-3 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-90"
                    >
                        <ImageIcon size={24} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                    />
                  </>
              )}
          </div>
      </div>
    </div>
  );
};

export const NotificationDrawer: React.FC<{ isOpen: boolean, onClose: () => void, notifications: Notification[], onMarkAsRead: (id: string) => void, onMarkAllRead: () => void }> = ({ isOpen, onClose, notifications, onMarkAsRead, onMarkAllRead }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ritual' | 'finance' | 'alert'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => activeFilter === 'all' || n.type === activeFilter);

  // Configurações visuais por tipo de notificação
  const typeConfig: Record<string, { icon: any, color: string, bg: string }> = {
      ritual: { icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      finance: { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      alert: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
      message: { icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col rounded-l-[3.5rem] border-l border-white/20">
        
        {/* Header Elegante */}
        <header className="p-8 pb-4 flex justify-between items-center bg-white/95 backdrop-blur-md rounded-tl-[3.5rem] z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-nature-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <Bell size={20} />
             </div>
             <div>
                 <h3 className="text-xl font-serif italic text-nature-900 leading-none">Central</h3>
                 <p className="text-[10px] text-nature-400 font-bold uppercase tracking-[0.2em] mt-1">Notificações</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-400 hover:text-nature-900 transition-colors"><X size={20}/></button>
        </header>

        {/* Filtros / Abas */}
        <div className="px-8 pb-6 border-b border-nature-50">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'ritual', label: 'Rituais' },
                    { id: 'finance', label: 'Finanças' },
                    { id: 'alert', label: 'Avisos' }
                ].map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setActiveFilter(f.id as any)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === f.id ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-400 border-nature-100 hover:border-nature-300'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar bg-primary-50/30">
          {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                  <Bell size={40} className="text-nature-300" />
                  <p className="text-xs text-nature-400 font-medium italic">O silêncio também é uma resposta.<br/>Nenhuma notificação por aqui.</p>
              </div>
          ) : (
             filteredNotifications.map(n => {
                const config = typeConfig[n.type] || typeConfig['alert'];
                const Icon = config.icon;
                return (
                    <div 
                        key={n.id} 
                        onClick={() => onMarkAsRead(n.id)} 
                        className={`p-5 rounded-3xl border transition-all relative overflow-hidden group cursor-pointer ${n.read ? 'bg-white border-nature-100 opacity-60' : 'bg-white border-primary-200 shadow-sm ring-1 ring-primary-50 scale-[1.02]'}`}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-xs truncate pr-2 ${n.read ? 'text-nature-600' : 'text-nature-900'}`}>{n.title}</h4>
                                    {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                                </div>
                                <p className="text-[11px] text-nature-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                                <p className="text-[9px] text-nature-300 mt-2 font-medium">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(n.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {/* Efeito Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] duration-1000"></div>
                    </div>
                );
             })
          )}
        </div>

        {/* Footer com Ação em Lote */}
        {notifications.some(n => !n.read) && (
            <div className="p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-white border-t border-nature-100 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={onMarkAllRead} 
                    className="w-full py-4 border border-dashed border-primary-300 text-primary-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Check size={14} /> Marcar todas como lidas
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export const CalendarWidget: React.FC = () => (
  <div className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-sm text-center">
    <Calendar size={40} className="mx-auto text-primary-500 mb-4" />
    <h4 className="font-serif italic text-lg text-nature-900">Agenda Holística</h4>
    <p className="text-xs text-nature-400 mt-2">Sincronize com os ritmos cósmicos.</p>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm ${className}`}>{children}</div>
);

export const OrganicSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-nature-100 animate-pulse rounded-[2rem] ${className}`}></div>
);

export const WalletSplit: React.FC<{ personal: number, corporate: number }> = ({ personal, corporate }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm">
      <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Pessoal</p>
      <h3 className="text-xl font-serif italic text-nature-900">R$ {personal.toFixed(2)}</h3>
    </div>
    <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm">
      <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Corporativo</p>
      <h3 className="text-xl font-serif italic text-nature-900">R$ {corporate.toFixed(2)}</h3>
    </div>
  </div>
);
