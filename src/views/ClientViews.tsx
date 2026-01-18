import React, { useState, useEffect } from 'react';
import { User, Professional, Service, ViewState, ContentItem, Product, CartItem, Order, Appointment, TherapyType, MoodOption, ToastMessage } from '../types';
import { MOCK_PROS, MOCK_SERVICES, MOCK_APPOINTMENTS, MOCK_PRODUCTS, MOCK_CONTENT, MOOD_HISTORY, MOCK_MESSAGES, MASTER_THERAPIES, SYMPTOM_TAGS, WELCOME_MESSAGES, MOOD_OPTIONS } from '../constants';
import { MapPin, Star, Calendar, Clock, ChevronLeft, Search, Filter, Leaf, Heart, Smile, Meh, Frown, CheckCircle, ShoppingBag, Award, Brain, ChevronRight, Sprout, Flower, Sun, Lock, Play, BookOpen, Music, Wind, Activity, Zap, Moon, MessageCircle, Send, Plus, Minus, Bell, CloudRain, Droplets, X, Trash2, CreditCard, QrCode, Video, FileText, Mic, VideoOff, MicOff, PhoneOff, Sparkles, PlusCircle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, XAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { BottomSheet, SuccessModal, GrowthGarden, SkeletonCard, OrganicSkeleton } from '../components/Common';
import { UserAura, Totem, GiftCard, GlobalImpact } from '../components/SocialFeatures';

interface ClientProps {
    user: User;
    setView: (view: ViewState) => void;
    // Cart Props
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    // Selection Props
    onViewDetails?: (pro: Professional) => void;
    selectedPro?: Professional | null;
    onStartBooking?: () => void;
    onToggleFavorite?: (proId: string) => void;
    onSelectPro?: (pro: Professional) => void;
    onBookingComplete?: () => void;
    mockBookAppointment?: () => void;
    // API Data
    professionals: Professional[];
    // Global
    showToast?: (msg: ToastMessage) => void;
}

// --- HELPERS ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
};

// --- COMPONENT: HOME EMOTION WIDGET (CHECK-IN) ---
const HomeEmotionWidget: React.FC<{ user: User }> = ({ user }) => {
    const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
    const [isBreathing, setIsBreathing] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);

    const handleMoodSelect = (mood: MoodOption) => {
        setSelectedMood(mood);
        setIsBreathing(true);

        // Calm Breathing Delay (1.5s) before showing suggestion
        setTimeout(() => {
            setIsBreathing(false);
            setShowSuggestion(true);
        }, 1500);
    };

    if (showSuggestion && selectedMood) {
        return (
            <div className="bg-[#e8efec] rounded-[2.5rem] p-6 relative overflow-hidden shadow-sm border border-white animate-in zoom-in duration-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200 rounded-bl-[5rem] opacity-40 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${selectedMood.color}`}>
                            <selectedMood.icon size={20} />
                        </div>
                        <p className="text-nature-600 text-sm font-medium">Entendemos. Aqui está algo leve.</p>
                    </div>

                    {/* Dynamic Suggestion based on Mood Context */}
                    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-5 border border-white/50 mb-4">
                        <h3 className="font-serif text-lg text-nature-800 mb-1">
                            {selectedMood.suggestionContext === 'low_effort' ? 'Pausa de 2 Minutos' :
                                selectedMood.suggestionContext === 'grounding' ? 'Respiração 4-7-8' :
                                    selectedMood.suggestionContext === 'comfort' ? 'Abraço Sonoro' : 'Expansão Criativa'}
                        </h3>
                        <p className="text-xs text-nature-500 leading-relaxed mb-3">
                            {selectedMood.suggestionContext === 'low_effort' ? 'Apenas feche os olhos. Não precisa fazer nada agora.' :
                                selectedMood.suggestionContext === 'grounding' ? 'Conecte os pés no chão e solte o ar devagar.' :
                                    'Uma frequência suave para acolher o que você sente.'}
                        </p>
                        <button className="flex items-center gap-2 text-primary-700 text-xs font-bold uppercase tracking-wider hover:gap-3 transition-all">
                            Começar <ArrowRight size={14} />
                        </button>
                    </div>

                    <button onClick={() => { setShowSuggestion(false); setSelectedMood(null); }} className="text-xs text-nature-400 underline w-full text-center">
                        Outro momento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-nature-100 relative overflow-hidden transition-all duration-500">
            {/* Breathing Overlay */}
            {isBreathing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center animate-ping text-primary-500">
                        <Leaf size={24} />
                    </div>
                    <p className="mt-4 text-nature-500 text-xs font-medium tracking-widest uppercase animate-pulse">Respirando...</p>
                </div>
            )}

            <h3 className="text-nature-800 font-medium mb-4 text-center">Como você está agora?</h3>
            <div className="flex justify-between items-center px-2">
                {MOOD_OPTIONS.map((mood) => (
                    <button
                        key={mood.id}
                        onClick={() => handleMoodSelect(mood)}
                        className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${mood.color} bg-opacity-50 group-hover:bg-opacity-100`}>
                            <mood.icon size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] text-nature-400 font-medium group-hover:text-nature-600">{mood.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- COMPONENT: BODY MAP (Visual Search Layer 2) ---
const BodyMap: React.FC<{ onSelectPart: (part: string) => void }> = ({ onSelectPart }) => {
    return (
        <div className="relative w-full h-96 flex items-center justify-center animate-in zoom-in duration-700">
            {/* Abstract Aura Background */}
            <div className="absolute w-64 h-64 bg-primary-100/50 rounded-full blur-[60px] animate-pulse"></div>

            <svg viewBox="0 0 200 400" className="h-full w-auto drop-shadow-lg relative z-10 text-nature-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Head */}
                <path d="M100,30 C120,30 130,50 130,70 C130,90 120,100 100,100 C80,100 70,90 70,70 C70,50 80,30 100,30 Z" className="hover:fill-primary-200 cursor-pointer transition-colors" onClick={() => onSelectPart('Cabeça')} />
                {/* Torso */}
                <path d="M70,100 C60,110 50,130 50,150 L50,220 C50,240 60,260 70,260 L130,260 C140,260 150,240 150,220 L150,150 C150,130 140,110 130,100 Z" className="hover:fill-primary-200 cursor-pointer transition-colors" onClick={() => onSelectPart('Tronco/Coração')} />
                {/* Arms */}
                <path d="M50,150 L20,180 C10,200 20,220 30,230" className="hover:stroke-primary-400 cursor-pointer transition-colors" strokeWidth="3" onClick={() => onSelectPart('Braços')} />
                <path d="M150,150 L180,180 C190,200 180,220 170,230" className="hover:stroke-primary-400 cursor-pointer transition-colors" strokeWidth="3" onClick={() => onSelectPart('Braços')} />
                {/* Legs */}
                <path d="M70,260 L70,350 C70,370 80,380 90,380" className="hover:stroke-primary-400 cursor-pointer transition-colors" strokeWidth="3" onClick={() => onSelectPart('Pernas')} />
                <path d="M130,260 L130,350 C130,370 120,380 110,380" className="hover:stroke-primary-400 cursor-pointer transition-colors" strokeWidth="3" onClick={() => onSelectPart('Pernas')} />
            </svg>

            {/* Labels */}
            <div className="absolute top-10 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] shadow-sm animate-bounce cursor-pointer" onClick={() => onSelectPart('Mente')}>Mente</div>
            <div className="absolute top-40 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] shadow-sm animate-bounce delay-75 cursor-pointer" onClick={() => onSelectPart('Coração')}>Emoção</div>
            <div className="absolute bottom-20 left-8 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] shadow-sm animate-bounce delay-150 cursor-pointer" onClick={() => onSelectPart('Digestão')}>Corpo</div>
        </div>
    );
};

// --- COMPONENT: SENSORY SEARCH ENGINE ---
const SensorySearchEngine: React.FC<ClientProps & { onViewDetails?: (pro: Professional) => void, onToggleFavorite?: (id: string) => void }> = ({ onViewDetails, onToggleFavorite, user, professionals }) => {
    const [searchLayer, setSearchLayer] = useState<1 | 2 | 3>(1); // 1: Tags, 2: Body, 3: AI
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Professional[]>([]);
    const [aiQuery, setAiQuery] = useState('');
    const [showSuggestModal, setShowSuggestModal] = useState(false);

    // Simulated "Breathing" Search
    const performSearch = (criteria: string) => {
        setIsSearching(true);
        // Simulate delay for "tuning in"
        setTimeout(() => {
            const criteriaLower = criteria.toLowerCase();
            const filtered = professionals.filter(p =>
                p.name.toLowerCase().includes(criteriaLower) ||
                (p.specialty && p.specialty.some(s => s.toLowerCase().includes(criteriaLower))) ||
                (p.bio && p.bio.toLowerCase().includes(criteriaLower))
            );
            setResults(filtered.length > 0 ? filtered : professionals); // Fallback to all pros for demo if empty
            setIsSearching(false);
        }, 1500);
    };

    // Layer 1: Tags
    const renderLayer1 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div>
                <h3 className="text-nature-500 text-sm font-medium mb-3">Sinto no corpo...</h3>
                <div className="flex flex-wrap gap-2">
                    {SYMPTOM_TAGS.PHYSICAL.map(tag => (
                        <button key={tag} onClick={() => performSearch(tag)} className="bg-white border border-nature-100 text-nature-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all active:scale-95 shadow-sm">
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-nature-500 text-sm font-medium mb-3">Sinto na alma...</h3>
                <div className="flex flex-wrap gap-2">
                    {SYMPTOM_TAGS.EMOTIONAL.map(tag => (
                        <button key={tag} onClick={() => performSearch(tag)} className="bg-white border border-nature-100 text-nature-600 px-4 py-2 rounded-full text-xs font-medium hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all active:scale-95 shadow-sm">
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Layer 3: AI Conversational
    const renderLayer3 = () => (
        <div className="animate-in slide-in-from-right duration-500">
            <div className="bg-white p-2 rounded-[2rem] border border-nature-200 shadow-sm flex items-center gap-2 mb-4 focus-within:ring-2 focus-within:ring-primary-200 transition-all">
                <div className="w-10 h-10 bg-nature-50 rounded-full flex items-center justify-center text-primary-500">
                    <Sparkles size={20} />
                </div>
                <input
                    type="text"
                    placeholder="O que você busca curar hoje?"
                    className="flex-1 bg-transparent outline-none text-nature-800 placeholder:text-nature-400 text-sm"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(aiQuery)}
                />
                <button onClick={() => performSearch(aiQuery)} aria-label="Enviar" className="p-3 bg-nature-900 text-white rounded-full hover:bg-black transition-colors">
                    <Send size={16} />
                </button>
            </div>
            <p className="text-xs text-center text-nature-400">Ex: "Estou muito estressado e com dor nas costas."</p>
        </div>
    );

    // LOADING STATE (Skeleton Screens)
    if (isSearching) {
        return (
            <div className="h-full px-2 space-y-4 pt-4">
                <div className="flex justify-center mb-8">
                    <div className="relative flex items-center justify-center w-32 h-32">
                        <div className="absolute w-full h-full bg-primary-100 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
                        <Leaf size={32} className="text-primary-600 relative z-10" />
                    </div>
                </div>
                <OrganicSkeleton className="h-8 w-1/3 mb-4 rounded-xl" />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    return (
        <div className="pb-24 h-full flex flex-col">
            {/* Header / Tabs */}
            <div className="bg-[#f2f7f5]/95 backdrop-blur-sm sticky top-0 z-20 pb-4">
                <h2 className="text-2xl font-light text-nature-800 mb-6 px-2">Descubra sua <span className="font-semibold text-primary-700">Cura</span></h2>

                <div className="flex bg-nature-100 p-1 rounded-full mx-2 mb-4 relative">
                    <div
                        className="absolute top-1 bottom-1 w-1/3 bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
                        style={{ left: searchLayer === 1 ? '4px' : searchLayer === 2 ? '33%' : '66%' }}
                    ></div>
                    <button onClick={() => setSearchLayer(1)} className={`flex-1 relative z-10 text-xs font-bold py-2.5 rounded-full transition-colors ${searchLayer === 1 ? 'text-primary-700' : 'text-nature-500'}`}>Sentir</button>
                    <button onClick={() => setSearchLayer(2)} className={`flex-1 relative z-10 text-xs font-bold py-2.5 rounded-full transition-colors ${searchLayer === 2 ? 'text-primary-700' : 'text-nature-500'}`}>Corpo</button>
                    <button onClick={() => setSearchLayer(3)} className={`flex-1 relative z-10 text-xs font-bold py-2.5 rounded-full transition-colors ${searchLayer === 3 ? 'text-primary-700' : 'text-nature-500'}`}>Conversar</button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-2">
                {results.length > 0 ? (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-nature-800">Profissionais Encontrados</h3>
                            <button onClick={() => setResults([])} className="text-xs text-nature-400 underline">Limpar busca</button>
                        </div>
                        {results.map(pro => {
                            const isFav = user.favorites?.includes(pro.id);
                            return (
                                <div key={pro.id} className="relative bg-white p-4 rounded-[2.5rem] border border-nature-100 shadow-sm transition-all hover:shadow-md hover:border-primary-100 group">
                                    {/* Favorite Button - Absolute & Isolated */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite && onToggleFavorite(pro.id);
                                        }}
                                        className={`absolute top-5 right-5 z-20 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isFav
                                            ? 'bg-red-50 text-red-500 shadow-inner'
                                            : 'bg-white/80 text-nature-300 hover:text-red-400 hover:bg-white shadow-sm'
                                            }`}
                                    >
                                        <Heart size={18} fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
                                    </button>

                                    {/* Main Action Area */}
                                    <div onClick={() => onViewDetails && onViewDetails(pro)} className="flex items-center gap-5 cursor-pointer">
                                        {/* Avatar */}
                                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-nature-50 flex-shrink-0 border border-nature-100 relative">
                                            <img src={pro.avatar} alt={pro.name} className="w-full h-full object-cover" />
                                            {/* Rating Badge Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm py-1 flex justify-center items-center gap-1 text-[10px] font-bold text-nature-800">
                                                <Star size={10} className="text-amber-400 fill-amber-400" /> {pro.rating}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="mb-1">
                                                <h4 className="font-serif text-lg font-bold text-nature-900 truncate pr-8">{pro.name}</h4>
                                                <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">{pro.specialty[0]}</p>
                                            </div>

                                            <p className="text-xs text-nature-500 line-clamp-2 mb-3 leading-relaxed">{pro.bio}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-xs text-nature-400">
                                                    <MapPin size={12} />
                                                    <span className="truncate max-w-[80px]">{pro.location.split(',')[0]}</span>
                                                </div>
                                                <span className="text-xs font-bold text-nature-800 bg-nature-50 px-2 py-1 rounded-lg">
                                                    {pro.priceRange}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        {searchLayer === 1 && renderLayer1()}
                        {searchLayer === 2 && <BodyMap onSelectPart={performSearch} />}
                        {searchLayer === 3 && renderLayer3()}
                    </>
                )}

                {/* Suggest New Therapy Button */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-nature-400 mb-3">Não encontrou o que buscava?</p>
                    <button onClick={() => setShowSuggestModal(true)} className="inline-flex items-center gap-2 bg-nature-50 border border-nature-200 text-nature-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white hover:border-primary-300 hover:text-primary-600 transition-all">
                        <PlusCircle size={14} /> Sugerir Nova Prática
                    </button>
                </div>
            </div>

            {/* SUGGESTION MODAL */}
            <BottomSheet isOpen={showSuggestModal} onClose={() => setShowSuggestModal(false)} title="Expandir o Jardim">
                <div className="space-y-4 pb-6">
                    <p className="text-sm text-nature-500 leading-relaxed">A Viva360 cresce com a comunidade. Sugira uma prática que ainda não temos.</p>
                    <div>
                        <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Nome da Técnica</label>
                        <input type="text" className="w-full p-4 bg-nature-50 rounded-2xl border-0 outline-none text-nature-800" placeholder="Ex: Leitura de Aura com Rosas" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-nature-400 uppercase tracking-wider mb-2 block">Para que serve?</label>
                        <div className="flex flex-wrap gap-2">
                            {['Ansiedade', 'Dores', 'Espiritual', 'Foco'].map(t => (
                                <span key={t} className="px-3 py-1.5 bg-white border border-nature-200 rounded-lg text-xs text-nature-500 cursor-pointer hover:border-primary-400 hover:text-primary-600">{t}</span>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setShowSuggestModal(false)} className="w-full bg-nature-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all mt-4">
                        Enviar Sugestão
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
};

// --- COMMERCE FLOW VIEWS ---

// 1. CART VIEW (Hybrid Drawer)
const ClientCart: React.FC<ClientProps> = ({ cart, removeFromCart, setView }) => {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-24">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setView(ViewState.CLIENT_HOME)} aria-label="Voltar"><ChevronLeft className="text-nature-500" /></button>
                    <h2 className="text-2xl font-light text-nature-800">Sua <span className="font-semibold">Cesta</span></h2>
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm text-nature-600 font-bold text-xs px-3">
                    {cart.length} itens
                </div>
            </div>

            {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-4 text-nature-400" />
                    <p>Sua cesta está leve.</p>
                    <button onClick={() => setView(ViewState.CLIENT_MARKET)} className="mt-4 text-primary-600 font-bold text-sm underline">Explorar Loja</button>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-4 px-1">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-nature-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Calendar className="text-primary-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-nature-800 text-sm truncate pr-2">{item.name}</h3>
                                    <button onClick={() => removeFromCart(item.id)} className="text-nature-300 hover:text-red-400" aria-label="Remover"><Trash2 size={16} /></button>
                                </div>
                                {item.type === 'service' ? (
                                    <p className="text-xs text-nature-500 mt-1 flex items-center gap-1"><Clock size={10} /> {new Date(item.date!).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                                ) : (
                                    <p className="text-xs text-nature-500 mt-1">Quantidade: {item.quantity}</p>
                                )}
                                <p className="text-primary-700 font-bold text-sm mt-1">R$ {item.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {cart.length > 0 && (
                <div className="mt-auto bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-lg -mx-2">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-nature-500 font-medium">Total</span>
                        <span className="text-2xl font-light text-nature-900">R$ {total.toFixed(2)}</span>
                    </div>
                    <button onClick={() => setView(ViewState.CLIENT_CHECKOUT)} className="w-full bg-nature-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2">
                        Confirmar Jornada <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

// 2. CHECKOUT VIEW
const ClientCheckout: React.FC<ClientProps> = ({ user, cart, clearCart, setView }) => {
    const [method, setMethod] = useState<'pix' | 'card'>('pix');
    const [processing, setProcessing] = useState(false);

    const handlePay = async () => {
        setProcessing(true);
        try {
            // Process each item in cart
            for (const item of cart) {
                if (item.type === 'service') {
                    await fetch('/api/appointments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientId: user.id,
                            professionalId: item.professionalId || 'pro1', // Fallback or extracted from item
                            serviceId: item.id,
                            serviceName: item.name,
                            date: item.date,
                            price: item.price
                        })
                    });
                }
            }

            clearCart();
            setView(ViewState.CLIENT_SUCCESS);
        } catch (err) {
            console.error("Payment failed", err);
            setProcessing(false);
        }
    };

    if (processing) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-nature-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                    <Leaf className="absolute inset-0 m-auto text-primary-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-light text-nature-800">Processando...</h3>
                <p className="text-nature-400 text-sm mt-2">Energizando seu pedido</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-24">
            <div className="flex items-center gap-2 mb-6 px-2">
                <button onClick={() => setView(ViewState.CLIENT_CART)} aria-label="Voltar"><ChevronLeft className="text-nature-500" /></button>
                <h2 className="text-2xl font-light text-nature-800">Pagamento <span className="font-semibold">Zen</span></h2>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto">
                {/* Security Badge */}
                <div className="bg-primary-50 p-3 rounded-xl flex items-center justify-center gap-2 text-primary-700 text-xs font-bold border border-primary-100">
                    <Lock size={12} /> Ambiente Seguro e Energizado
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setMethod('pix')}
                        className={`p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-2 transition-all ${method === 'pix' ? 'bg-nature-800 text-white border-nature-800 shadow-lg' : 'bg-white border-nature-100 text-nature-400'}`}
                    >
                        <QrCode size={24} />
                        <span className="text-sm font-medium">PIX</span>
                    </button>
                    <button
                        onClick={() => setMethod('card')}
                        className={`p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-2 transition-all ${method === 'card' ? 'bg-nature-800 text-white border-nature-800 shadow-lg' : 'bg-white border-nature-100 text-nature-400'}`}
                    >
                        <CreditCard size={24} />
                        <span className="text-sm font-medium">Cartão</span>
                    </button>
                </div>

                {/* Dynamic Content */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm min-h-[200px] flex items-center justify-center">
                    {method === 'pix' ? (
                        <div className="text-center w-full">
                            <div className="w-40 h-40 bg-nature-50 mx-auto rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-nature-200">
                                <QrCode size={64} className="text-nature-800" />
                            </div>
                            <p className="text-xs text-nature-500 font-mono bg-nature-50 p-2 rounded-lg break-all">00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000</p>
                            <button className="mt-3 text-primary-600 font-bold text-xs uppercase tracking-wider">Copiar Código</button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="bg-gradient-to-br from-nature-700 to-nature-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-4">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="flex justify-between mb-8"><CreditCard /><span className="font-mono opacity-70">VIRTUAL</span></div>
                                <div className="font-mono text-lg tracking-widest mb-2">•••• •••• •••• 4242</div>
                                <div className="flex justify-between text-xs opacity-70"><span>ANA SILVA</span><span>12/28</span></div>
                            </div>
                            <div className="flex justify-center"><button className="text-primary-600 text-xs font-bold">+ Adicionar Novo Cartão</button></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4">
                <button onClick={handlePay} className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    Confirmar Pagamento
                </button>
            </div>
        </div>
    );
};

// 3. SUCCESS VIEW
const ClientSuccess: React.FC<ClientProps & { showToast?: (m: ToastMessage) => void }> = ({ setView, showToast }) => {

    // Golden Loop 1: Post-Booking Logic -> Trigger Chat Mock
    useEffect(() => {
        if (showToast) {
            setTimeout(() => {
                showToast({ id: 'chat-created', type: 'info', title: 'Canal Aberto', message: 'O chat com Sofia Luz foi ativado.' });
            }, 1500);
        }
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-700 pb-20">
            {/* Confetti Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <Leaf key={i} size={Math.random() * 20 + 10} className="absolute text-primary-300 opacity-50 animate-bounce" style={{
                        top: '-10%',
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 3 + 2}s`,
                        animationDelay: `${Math.random()}s`
                    }} />
                ))}
            </div>

            <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-8 shadow-2xl shadow-primary-200 relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-ping opacity-20"></div>
                <CheckCircle size={64} strokeWidth={1.5} />
            </div>

            <h2 className="text-3xl font-light text-nature-800 mb-2">Gratidão</h2>
            <p className="text-nature-500 max-w-xs mx-auto mb-8 leading-relaxed">Sua jornada de cura está confirmada. Preparamos tudo com muito carinho para você.</p>

            <div className="w-full max-w-xs space-y-3">
                <button onClick={() => setView(ViewState.CLIENT_ORDERS)} className="w-full bg-nature-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-lg">
                    Ver Meus Pedidos
                </button>
                <button onClick={() => setView(ViewState.CLIENT_HOME)} className="w-full bg-white border border-nature-200 text-nature-600 font-bold py-4 rounded-xl hover:bg-nature-50 transition-all">
                    Voltar ao Jardim
                </button>
            </div>
        </div>
    );
};

// --- CONSUMPTION FLOW VIEWS ---

// 4. VIDEO ROOM (Telemedicine)
const ClientVideoRoom: React.FC<ClientProps & { showToast?: (m: ToastMessage) => void }> = ({ setView, showToast }) => {
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);

    const handleEndCall = () => {
        // Golden Loop 2: End Session -> Trigger Garden Growth
        if (showToast) showToast({ id: 'growth', type: 'success', title: 'Sessão Concluída', message: 'Seu jardim recebeu nova energia.' });
        setView(ViewState.CLIENT_JOURNEY);
    };

    return (
        <div className="h-full bg-nature-900 absolute inset-0 z-50 flex flex-col text-white animate-in fade-in duration-700">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView(ViewState.CLIENT_ORDERS)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><ChevronLeft /></button>
                    <div>
                        <h3 className="font-semibold text-lg">Sofia Luz</h3>
                        <p className="text-xs opacity-70 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Ao Vivo • 00:12:45</p>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
                    <div className="w-24 h-32 bg-black/30 rounded-lg overflow-hidden relative">
                        {/* User Self View */}
                        {camOn ? <img src="https://picsum.photos/100/100" className="w-full h-full object-cover opacity-80" alt="Me" /> : <div className="w-full h-full flex items-center justify-center bg-nature-800"><VideoOff size={16} /></div>}
                    </div>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative overflow-hidden">
                <img src="https://picsum.photos/800/1200" className="w-full h-full object-cover" alt="Therapist" />

                {/* Notes Drawer (Overlay) */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-12 hover:w-64 h-64 bg-white/10 backdrop-blur-md rounded-l-2xl transition-all duration-300 group overflow-hidden border-l border-white/20">
                    <div className="h-full p-4 flex flex-col">
                        <div className="flex items-center gap-3 mb-4 text-primary-200">
                            <FileText size={20} className="shrink-0" />
                            <span className="font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Anotações</span>
                        </div>
                        <textarea placeholder="Escreva seus insights..." className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder:text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 flex justify-center items-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
                <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                    {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button onClick={handleEndCall} className="p-6 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-900/50 transform hover:scale-105 transition-all">
                    <PhoneOff size={32} fill="currentColor" />
                </button>
                <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full transition-all ${camOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                    {camOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
            </div>
        </div>
    );
};

// 5. DIGITAL TICKET (In-person Check-in)
const ClientTicket: React.FC<ClientProps> = ({ setView }) => (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in pb-20">
        <button onClick={() => setView(ViewState.CLIENT_ORDERS)} className="absolute top-6 left-6 text-nature-500"><ChevronLeft size={24} /></button>

        <h2 className="text-2xl font-light text-nature-800 mb-8">Seu <span className="font-semibold">Check-in</span></h2>

        <div className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border border-nature-100 max-w-xs">
            {/* Top Part */}
            <div className="bg-primary-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white/10 rotate-45 pointer-events-none"></div>
                <h3 className="text-xl font-bold mb-1">Sessão de Reiki</h3>
                <p className="text-primary-100 text-sm">com Sofia Luz</p>
            </div>

            {/* Middle Part */}
            <div className="p-8 flex flex-col items-center gap-6 bg-white relative">
                {/* Punch Holes */}
                <div className="absolute -left-3 top-[-12px] w-6 h-6 bg-[#f2f7f5] rounded-full"></div>
                <div className="absolute -right-3 top-[-12px] w-6 h-6 bg-[#f2f7f5] rounded-full"></div>

                <div className="text-center space-y-1">
                    <p className="text-xs text-nature-400 uppercase tracking-widest">Data & Hora</p>
                    <p className="text-xl font-mono text-nature-800 font-bold">12 OUT • 14:00</p>
                </div>

                <div className="border-2 border-dashed border-nature-200 p-2 rounded-xl">
                    <QrCode size={140} className="text-nature-900" />
                </div>

                <p className="text-[10px] text-nature-400 text-center max-w-[150px]">Apresente este código na recepção do Espaço Zen.</p>
            </div>

            {/* Bottom Part */}
            <div className="bg-nature-50 p-4 text-center border-t border-nature-100">
                <button className="text-primary-600 text-xs font-bold flex items-center justify-center gap-1">
                    <MapPin size={12} /> Ver localização
                </button>
            </div>
        </div>
    </div>
);

// 6. ORDER HISTORY
const ClientOrders: React.FC<ClientProps> = ({ setView }) => {
    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-24">
            <div className="flex items-center gap-2 mb-6 px-2">
                <button onClick={() => setView(ViewState.CLIENT_PROFILE)} aria-label="Voltar"><ChevronLeft className="text-nature-500" /></button>
                <h2 className="text-2xl font-light text-nature-800">Meus <span className="font-semibold">Pedidos</span></h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 px-1">
                {['Agendados', 'Concluídos', 'Produtos'].map((tab, i) => (
                    <button key={tab} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${i === 0 ? 'bg-nature-800 text-white' : 'bg-white border border-nature-100 text-nature-500'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            <div className="space-y-4 overflow-y-auto px-1">
                {/* Online Appointment */}
                <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600"><Video size={20} /></div>
                            <div>
                                <h4 className="font-bold text-nature-800">Psicoterapia Holística</h4>
                                <p className="text-xs text-nature-500">com Sofia Luz • Hoje, 15:00</p>
                            </div>
                        </div>
                        <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-md">Confirmado</span>
                    </div>
                    <button onClick={() => setView(ViewState.CLIENT_VIDEO_ROOM)} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary-200/50 hover:bg-primary-700">Entrar na Sala</button>
                </div>

                {/* In-Person Appointment */}
                <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><MapPin size={20} /></div>
                            <div>
                                <h4 className="font-bold text-nature-800">Sessão de Reiki</h4>
                                <p className="text-xs text-nature-500">Espaço Zen • 12 Out, 14:00</p>
                            </div>
                        </div>
                        <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-md">Confirmado</span>
                    </div>
                    <button onClick={() => setView(ViewState.CLIENT_TICKET)} className="w-full bg-nature-50 text-nature-700 border border-nature-200 py-3 rounded-xl font-bold text-sm hover:bg-nature-100 flex items-center justify-center gap-2"><QrCode size={16} /> Ver Ticket</button>
                </div>

                {/* Past Product Order */}
                <div className="bg-white p-5 rounded-[2rem] border border-nature-100 shadow-sm opacity-70">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-nature-50 rounded-2xl flex items-center justify-center"><ShoppingBag size={20} className="text-nature-400" /></div>
                        <div>
                            <h4 className="font-bold text-nature-800">Kit Óleos Essenciais</h4>
                            <p className="text-xs text-nature-500">Entregue em 05 Out</p>
                            <button className="text-xs text-primary-600 font-bold mt-1 underline">Adquirir Novamente</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientBooking: React.FC<{ pro: Professional, onBack: () => void, onAddToCart: (s: Service, date: string) => void }> = ({ pro, onBack, onAddToCart }) => {
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const services = MOCK_SERVICES.filter(s => s.professionalId === pro.id);

    const handleConfirm = () => {
        if (selectedService && selectedDate) {
            onAddToCart(selectedService, selectedDate);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-light text-nature-800">Agendar <span className="font-semibold">Sessão</span></h2>
                    <p className="text-sm text-nature-400">Com {pro.name}</p>
                </div>
                <button onClick={onBack} className="text-xs text-nature-400 hover:text-red-400 underline">Cancelar</button>
            </div>

            <div className="flex gap-2 mt-2 mb-6"><div className={`h-1.5 rounded-full flex-1 transition-all ${step >= 1 ? 'bg-primary-500' : 'bg-nature-200'}`}></div><div className={`h-1.5 rounded-full flex-1 transition-all ${step >= 2 ? 'bg-primary-500' : 'bg-nature-200'}`}></div></div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-28">
                <section className={step !== 1 ? 'opacity-50 pointer-events-none' : ''}><h3 className="font-bold text-nature-800 mb-3 text-sm uppercase tracking-wider text-primary-600">1. Escolha o serviço</h3><div className="space-y-3">{services.map(service => (<div key={service.id} onClick={() => { setSelectedService(service); setStep(2); }} className={`p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 ${selectedService?.id === service.id ? 'border-primary-500 bg-primary-50 shadow-md ring-1 ring-primary-200' : 'border-nature-100 bg-white hover:border-primary-200'}`}><div className="flex justify-between items-center mb-1"><h4 className="font-semibold text-nature-800">{service.name}</h4><span className="font-bold text-primary-700 bg-white px-3 py-1 rounded-full text-xs">R$ {service.price}</span></div><div className="flex justify-between items-center text-sm text-nature-500"><div className="flex items-center gap-1"><Clock size={14} /><span>{service.duration} min</span></div></div></div>))}</div></section>

                {step >= 2 && (<section className="animate-in fade-in slide-in-from-bottom-4 duration-500"><h3 className="font-bold text-nature-800 mb-3 text-sm uppercase tracking-wider text-primary-600 flex justify-between items-center">2. Escolha o horário{selectedDate && <button onClick={() => setStep(1)} className="text-[10px] underline text-nature-400">Mudar</button>}</h3><div className="grid grid-cols-3 gap-3">{['09:00', '10:30', '14:00', '16:30'].map(time => (<button key={time} onClick={() => setSelectedDate(new Date().toISOString())} className={`py-4 rounded-2xl text-sm font-medium border transition-all duration-200 ${selectedDate ? 'bg-primary-600 text-white border-primary-600 shadow-lg transform scale-105' : 'bg-white text-nature-600 border-nature-100 hover:border-primary-300 hover:bg-primary-50'}`}>{time}</button>))}</div></section>)}

                {selectedService && selectedDate && (<div className="bg-[#e8efec] p-6 rounded-[2rem] mt-6 animate-in zoom-in duration-300 border border-white"><h4 className="font-bold text-nature-800 mb-4">Resumo</h4><div className="flex justify-between text-sm mb-2"><span className="text-nature-500">Serviço</span><span className="font-medium text-nature-800">{selectedService.name}</span></div><div className="flex justify-between text-sm mb-2"><span className="text-nature-500">Profissional</span><span className="font-medium text-nature-800">{pro.name}</span></div><div className="flex justify-between text-sm mb-4"><span className="text-nature-500">Total</span><span className="font-bold text-primary-700 text-lg">R$ {selectedService.price}</span></div></div>)}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-white/50 md:relative md:bg-transparent md:p-0"><button disabled={!selectedService || !selectedDate} onClick={handleConfirm} className="w-full bg-nature-900 text-white font-medium text-lg py-4 rounded-[1.5rem] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-all shadow-xl disabled:shadow-none flex items-center justify-center gap-2">Adicionar à Cesta <ShoppingBag size={18} /></button></div>
        </div>
    );
};

const ClientMarket: React.FC<ClientProps & { setView: any }> = ({ setView, addToCart, user }) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Modified to use addToCart
    const handleAdd = () => {
        if (selectedProduct) {
            addToCart({
                id: Math.random().toString(),
                type: 'product',
                name: selectedProduct.name,
                price: selectedProduct.price,
                quantity: 1,
                image: selectedProduct.image
            });
            setSelectedProduct(null);
            // Optionally show toast
        }
    };

    if (selectedProduct) {
        return (
            <div className="animate-in slide-in-from-right duration-500 pb-24">
                <button onClick={() => setSelectedProduct(null)} className="mb-4 flex items-center gap-2 text-nature-500 hover:text-primary-600 text-sm">
                    <ChevronLeft size={16} /> Voltar para Loja
                </button>

                <div className="bg-white rounded-[2.5rem] p-2 border border-nature-100 shadow-sm mb-6">
                    <div className="h-64 rounded-[2rem] overflow-hidden bg-nature-100 relative">
                        <img src={selectedProduct.image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 bg-white/40 backdrop-blur-md p-2 rounded-full text-nature-800 cursor-pointer hover:bg-white hover:text-red-500 transition-all">
                            <Heart size={20} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-2">
                    {/* ... Product Info ... */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-serif text-nature-900">{selectedProduct.name}</h2>
                            <span className="text-xl font-bold text-primary-700">R$ {selectedProduct.price}</span>
                        </div>
                        <p className="text-nature-500 text-sm leading-relaxed">{selectedProduct.description}</p>
                    </div>
                    {/* ... Holistic Tip ... */}
                    {selectedProduct.holisticTip && (
                        <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100">
                            <h3 className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
                                <Sparkles size={16} /> Dica Holística
                            </h3>
                            <p className="text-amber-800 text-xs leading-relaxed italic">"{selectedProduct.holisticTip}"</p>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-[2rem] border border-nature-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="w-8 h-8 rounded-full border border-nature-200 flex items-center justify-center text-nature-500 hover:bg-nature-50"><Minus size={14} /></button>
                            <span className="font-bold text-nature-800">1</span>
                            <button className="w-8 h-8 rounded-full border border-nature-200 flex items-center justify-center text-nature-500 hover:bg-nature-50"><Plus size={14} /></button>
                        </div>
                        <button onClick={handleAdd} className="bg-nature-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all">
                            Adicionar à Cesta
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            <div>
                <div className="flex items-center justify-between px-2 mb-4">
                    <h2 className="text-2xl font-light text-nature-800">Holistic <span className="font-semibold">Shop</span></h2>
                    <div onClick={() => setView(ViewState.CLIENT_CART)} className="bg-white border border-nature-200 text-nature-600 p-2.5 rounded-full shadow-sm relative cursor-pointer hover:border-primary-300 transition-colors"><ShoppingBag size={20} /><span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-white"></span></div>
                </div>
                {/* Featured Card */}
                <div className="bg-[#f0ece6] rounded-[2.5rem] p-6 relative overflow-hidden shadow-sm group cursor-pointer border border-white">
                    <div className="absolute right-0 top-0 h-full w-1/2"><img src="https://picsum.photos/400/300" className="w-full h-full object-cover opacity-80 mix-blend-multiply" alt="Workshop" /><div className="absolute inset-0 bg-gradient-to-r from-[#f0ece6] to-transparent"></div></div>
                    <div className="relative z-10 max-w-[60%]"><span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider mb-2 inline-block">Destaque</span><h3 className="text-xl font-serif text-nature-900 leading-tight mb-2">Workshop: Cura Interior</h3><p className="text-xs text-nature-500 mb-4 line-clamp-2">Uma imersão completa para reequilibrar suas energias.</p><button className="bg-nature-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-lg shadow-nature-900/20">Garantir Vaga</button></div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                {['Tudo', 'Óleos', 'Cristais', 'Incensos', 'Workshops', 'Yoga'].map((cat, i) => (<button key={cat} className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${i === 0 ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-white text-nature-500 border border-nature-100 hover:border-primary-200 hover:text-primary-600'}`}>{cat}</button>))}
            </div>

            <div className="grid grid-cols-2 gap-5">
                {MOCK_PRODUCTS.map(product => (
                    <div key={product.id} className="group relative flex flex-col gap-3 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        <div className="aspect-[4/5] bg-white p-2 rounded-[2rem] shadow-sm border border-nature-100 group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1 overflow-hidden">
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-nature-900 shadow-sm">R$ {product.price.toFixed(0)}</div>
                            </div>
                        </div>
                        <div className="px-2">
                            <h4 className="font-medium text-nature-900 text-sm leading-tight mb-1 group-hover:text-primary-700 transition-colors">{product.name}</h4>
                            <p className="text-[10px] text-nature-400 uppercase tracking-wide">{product.category}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- RESTORED COMPONENTS ---

const ClientHome: React.FC<ClientProps> = ({ user, setView }) => {
    return (
        <div className="space-y-6 animate-in fade-in pb-24 relative">
            {/* Greeting Header with Totem */}
            <div className="flex justify-between items-start px-2 relative z-20">
                <div>
                    <p className="text-nature-500 text-sm font-medium mb-1">{getGreeting()},</p>
                    <h2 className="text-3xl font-light text-nature-800">{user.name.split(' ')[0]}</h2>
                </div>

                <div className="flex gap-4 items-start">
                    {/* TOTEM COMPANION */}
                    <Totem mood={user.mood || 3} />

                    <button onClick={() => setView(ViewState.CLIENT_NOTIFICATIONS)} className="bg-white p-3 rounded-full text-nature-400 hover:text-primary-600 shadow-sm transition-colors relative mt-1">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
                    </button>
                </div>
            </div>

            {/* EMOTION CHECK-IN WIDGET */}
            <HomeEmotionWidget user={user} />

            {/* GROWTH GARDEN (GAMIFICATION) */}
            <div className="relative overflow-hidden cursor-pointer" onClick={() => setView(ViewState.CLIENT_JOURNEY)}>
                <GrowthGarden streak={user.streak || 0} lastActive={user.lastLogin} />
                <div className="absolute bottom-4 w-full text-center">
                    <button className="text-xs font-bold text-nature-600 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 shadow-sm">
                        {user.streak} dias de constância
                    </button>
                </div>
            </div>

            {/* Content River (Horizontal Scroll) */}
            <div>
                <h3 className="font-semibold text-nature-800 px-2 mb-3">Para você agora</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-2 -mx-2">
                    {MOCK_CONTENT.filter(c => c.isRiver).map(content => (
                        <div key={content.id} className="flex-shrink-0 w-64 bg-white p-3 rounded-[2rem] border border-nature-100 shadow-sm snap-center">
                            <div className="h-32 rounded-[1.5rem] bg-nature-200 mb-3 overflow-hidden relative">
                                <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                                    <Play size={10} fill="currentColor" /> {content.duration}
                                </div>
                                {/* GIFT BUTTON INTEGRATION */}
                                {content.isGiftable && (
                                    <div className="absolute top-2 right-2">
                                        <GiftCard item={content} userGifts={user.giftsAvailable || 0} />
                                    </div>
                                )}
                            </div>
                            <h4 className="font-bold text-nature-800 text-sm leading-tight mb-1">{content.title}</h4>
                            <p className="text-xs text-nature-500 line-clamp-2">{content.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setView(ViewState.CLIENT_SEARCH)} className="bg-primary-50 p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-primary-800 hover:bg-primary-100 transition-colors">
                    <Search size={24} />
                    <span className="text-xs font-bold">Buscar Pro</span>
                </button>
                <button onClick={() => setView(ViewState.CLIENT_METRICS)} className="bg-nature-50 p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-nature-800 hover:bg-nature-100 transition-colors">
                    <Activity size={24} />
                    <span className="text-xs font-bold">Meu Humor</span>
                </button>
            </div>
        </div>
    );
};

const ClientProDetails: React.FC<{ pro: Professional, onBack: () => void, onBook: () => void, onToggleFavorite?: (id: string) => void, isFavorite?: boolean }> = ({ pro, onBack, onBook, onToggleFavorite, isFavorite }) => (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-24">
        {/* Header Image Area */}
        <div className="relative h-64 -mx-6 -mt-6 mb-6">
            <img src={pro.avatar} alt={pro.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f2f7f5] via-transparent to-black/30"></div>
            <button onClick={onBack} className="absolute top-6 left-6 text-white bg-black/20 backdrop-blur-md p-2 rounded-full hover:bg-black/40"><ChevronLeft size={24} /></button>
            <button onClick={() => onToggleFavorite && onToggleFavorite(pro.id)} className={`absolute top-6 right-6 p-2 rounded-full backdrop-blur-md transition-colors ${isFavorite ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-black/40'}`}>
                <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
            <div className="px-2">
                <h1 className="text-3xl font-serif text-nature-900 mb-1">{pro.name}</h1>
                <p className="text-primary-600 font-bold uppercase tracking-wider text-xs mb-4">{pro.specialty.join(' • ')}</p>

                <div className="flex gap-4 text-sm text-nature-600 mb-6">
                    <div className="flex items-center gap-1"><Star size={16} className="text-amber-400 fill-amber-400" /><span className="font-bold">{pro.rating}</span></div>
                    <div className="flex items-center gap-1"><MapPin size={16} /><span>{pro.location}</span></div>
                    <div className="flex items-center gap-1"><span className="font-bold text-nature-800">{pro.priceRange}</span></div>
                </div>

                <div className="space-y-2 mb-6">
                    <h3 className="font-bold text-nature-800 text-sm">Sobre</h3>
                    <p className="text-nature-500 text-sm leading-relaxed">{pro.bio}</p>
                </div>

                <div className="bg-white p-4 rounded-[2rem] border border-nature-100 shadow-sm">
                    <h3 className="font-bold text-nature-800 text-sm mb-3">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                        {pro.specialty.map(s => (
                            <span key={s} className="bg-nature-50 text-nature-600 px-3 py-1 rounded-lg text-xs font-medium">{s}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-4">
            <button onClick={onBook} className="w-full bg-nature-900 text-white font-bold py-4 rounded-[1.5rem] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2">
                Agendar Sessão
            </button>
        </div>
    </div>
);

const ClientChat: React.FC<ClientProps> = ({ setView }) => {
    return (
        <div className="h-full flex flex-col pb-24 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 mb-6 px-2">
                <button onClick={() => setView(ViewState.CLIENT_HOME)} aria-label="Voltar"><ChevronLeft className="text-nature-500" /></button>
                <h2 className="text-2xl font-light text-nature-800">Mensagens</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
                {MOCK_MESSAGES.map((msg, i) => (
                    <div key={msg.id} className="bg-white p-4 rounded-[2rem] border border-nature-100 flex gap-4 items-center cursor-pointer hover:border-primary-200 transition-colors">
                        <div className="relative">
                            <img src={MOCK_PROS[0].avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                            {i === 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-nature-800 text-sm">{MOCK_PROS[0].name}</h4>
                                <span className="text-[10px] text-nature-400">{msg.timestamp}</span>
                            </div>
                            <p className={`text-xs truncate ${!msg.isRead && msg.senderId !== 'client1' ? 'font-bold text-nature-800' : 'text-nature-500'}`}>{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClientMetrics: React.FC<ClientProps> = ({ setView }) => (<div className="animate-in slide-in-from-right duration-500 space-y-6 pb-20"><div className="px-2"><h2 className="text-2xl font-light text-nature-800">Seu <span className="font-semibold">Equilíbrio</span></h2><p className="text-sm text-nature-500">Visualize sua evolução emocional.</p></div><div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-nature-100"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><div className="bg-primary-50 p-2 rounded-xl text-primary-600"><Activity size={18} /></div><span className="font-semibold text-nature-800">Humor</span></div></div><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={MOOD_HISTORY} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}><defs><linearGradient id="colorMoodMetric" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#588179" stopOpacity={0.3} /><stop offset="95%" stopColor="#588179" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#f5f5f4" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 10 }} dy={10} /><Tooltip cursor={{ stroke: '#588179', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} /><Area type="monotone" dataKey="value" stroke="#588179" strokeWidth={3} fill="url(#colorMoodMetric)" activeDot={{ r: 6, strokeWidth: 0 }} /></AreaChart></ResponsiveContainer></div></div><div className="grid grid-cols-2 gap-4"><div className="bg-[#f0f9ff] p-5 rounded-[2rem] flex flex-col justify-between h-36 relative overflow-hidden group"><div className="absolute top-0 right-0 w-20 h-20 bg-white/40 rounded-full blur-xl -mr-6 -mt-6"></div><div className="bg-white/60 w-10 h-10 rounded-full flex items-center justify-center text-blue-500 mb-2"><Moon size={20} /></div><div><span className="text-3xl font-bold text-blue-900 tracking-tight">12</span><p className="text-xs text-blue-600 font-medium uppercase tracking-wide mt-1">Sessões</p></div></div><div className="bg-[#fffbeb] p-5 rounded-[2rem] flex flex-col justify-between h-36 relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-white/40 rounded-full blur-xl -mr-6 -mt-6"></div><div className="bg-white/60 w-10 h-10 rounded-full flex items-center justify-center text-amber-500 mb-2"><Sun size={20} /></div><div><span className="text-3xl font-bold text-amber-900 tracking-tight">5</span><p className="text-xs text-amber-600 font-medium uppercase tracking-wide mt-1">Dias Zen</p></div></div></div><div className="bg-white p-6 rounded-[2rem] border border-nature-100 flex items-start gap-4"><div className="bg-nature-50 p-3 rounded-2xl text-nature-500 flex-shrink-0"><Brain size={20} /></div><div><h4 className="font-bold text-nature-800 text-sm mb-1">Insight da Semana</h4><p className="text-xs text-nature-500 leading-relaxed">Você registra maior bem-estar após sessões de Yoga às terças-feiras.</p></div></div></div>);
const ClientJourney: React.FC<ClientProps> = ({ user }) => { const steps = [{ id: 1, title: 'Semente', icon: <Leaf size={20} />, status: 'completed', desc: 'Início da jornada' }, { id: 2, title: 'Brotar', icon: <Sprout size={20} />, status: 'current', desc: 'Criando raízes' }, { id: 3, title: 'Crescer', icon: <Leaf size={24} />, status: 'locked', desc: 'Expandindo' }, { id: 4, title: 'Florescer', icon: <Flower size={24} />, status: 'locked', desc: 'Plenitude' },]; return (<div className="animate-in slide-in-from-bottom-8 duration-700 pb-20"><div className="px-2 mb-8 text-center"><div className="inline-block p-1 bg-white border border-nature-100 rounded-full mb-4 shadow-sm"><img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" /></div><h2 className="text-2xl font-light text-nature-800">Meu <span className="font-semibold">Caminho</span></h2><div className="flex justify-center gap-4 mt-3"><div className="bg-amber-50 px-3 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1"><Zap size={12} fill="currentColor" /> {user.streak} dias seguidos</div><div className="bg-primary-50 px-3 py-1 rounded-full text-xs font-bold text-primary-600 flex items-center gap-1"><Award size={12} /> {user.points} pts</div></div></div><div className="bg-[#e8efec] rounded-[3rem] p-8 relative overflow-hidden min-h-[500px] shadow-sm"><svg className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-full pointer-events-none opacity-20" viewBox="0 0 100 500"><path d="M50 0 C 50 50, 20 100, 50 150 C 80 200, 20 300, 50 350 C 80 400, 50 450, 50 500" fill="none" stroke="#588179" strokeWidth="3" strokeDasharray="8,8" strokeLinecap="round" /></svg><div className="flex flex-col items-center gap-14 relative z-10 pt-4">{steps.map((step, index) => (<div key={step.id} className={`flex items-center gap-4 w-full ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}><div className={`w-16 h-16 rounded-full flex items-center justify-center border-[3px] shadow-sm z-10 transition-all duration-500 relative ${step.status === 'completed' ? 'bg-primary-600 border-white text-white' : step.status === 'current' ? 'bg-white border-primary-400 text-primary-600 scale-125 ring-8 ring-white/50' : 'bg-nature-200 border-nature-100 text-nature-400'}`}>{step.status === 'locked' ? <Lock size={18} /> : step.icon}</div><div className={`bg-white/80 backdrop-blur-sm p-4 rounded-[1.5rem] shadow-sm border border-white flex-1 text-center ${step.status === 'locked' ? 'opacity-40' : ''}`}><h4 className="font-bold text-nature-800 text-sm mb-0.5">{step.title}</h4><p className="text-[10px] text-nature-500">{step.desc}</p></div></div>))}</div></div> <div className="mt-8"> <GlobalImpact /> </div></div>); };
const ClientHistory: React.FC<ClientProps> = ({ user }) => (<div className="space-y-6 animate-in fade-in duration-500"><div className="flex items-center gap-5 bg-white p-8 rounded-[2.5rem] shadow-sm border border-nature-100 relative overflow-hidden"><div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none"><UserAura user={user} /></div><img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-[2rem] object-cover bg-nature-200 relative z-10" /><div><h2 className="text-2xl font-semibold text-nature-900 relative z-10">{user.name}</h2><p className="text-nature-500 text-sm mb-3 relative z-10">{user.email}</p><button className="text-primary-700 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide relative z-10">Editar Perfil</button></div></div><div><h3 className="font-medium text-lg text-nature-800 mb-4 px-2">Sua Aura</h3><div className="mb-8"><UserAura user={user} /></div><h3 className="font-medium text-lg text-nature-800 mb-4 px-2">Histórico</h3><div className="space-y-4">{MOCK_APPOINTMENTS.filter(a => a.clientId === user.id).map(appt => (<div key={appt.id} className="bg-white p-5 rounded-3xl border border-nature-100 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-nature-100 text-nature-500"><Calendar size={20} /></div><div><h4 className="font-semibold text-nature-800">{appt.serviceName}</h4><p className="text-sm text-nature-500">{new Date(appt.date).toLocaleDateString()}</p></div></div><div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-nature-50 text-nature-400">{appt.status}</div></div>))}</div></div></div>);

// --- MAIN EXPORT ---
export const ClientViews: React.FC<ClientProps & { view: ViewState, onSelectPro: (p: Professional) => void, selectedPro: Professional | null, onBookingComplete: () => void, professionals: Professional[] }> = (props) => {
    switch (props.view) {
        // Search & Discovery (REPLACED)
        case ViewState.CLIENT_SEARCH: return <SensorySearchEngine {...props} />;

        // Commerce & Flows
        case ViewState.CLIENT_CART: return <ClientCart {...props} />;
        case ViewState.CLIENT_CHECKOUT: return <ClientCheckout {...props} clearCart={props.clearCart} />;
        case ViewState.CLIENT_SUCCESS: return <ClientSuccess {...props} />;
        case ViewState.CLIENT_VIDEO_ROOM: return <ClientVideoRoom {...props} />;
        case ViewState.CLIENT_TICKET: return <ClientTicket {...props} />;
        case ViewState.CLIENT_ORDERS: return <ClientOrders {...props} />;

        case ViewState.CLIENT_BOOKING_FLOW:
            if (!props.selectedPro) return <SensorySearchEngine {...props} />;
            return <ClientBooking pro={props.selectedPro} onBack={() => props.setView(ViewState.CLIENT_PRO_DETAILS)} onAddToCart={(service, date) => {
                props.addToCart({
                    id: Math.random().toString(),
                    type: 'service',
                    name: service.name,
                    price: service.price,
                    quantity: 1,
                    date: date,
                    professionalName: props.selectedPro?.name
                });
                props.setView(ViewState.CLIENT_CART);
            }} />;

        // Existing Views
        case ViewState.CLIENT_HOME: return <ClientHome {...props} />;
        case ViewState.CLIENT_PRO_DETAILS: if (!props.selectedPro) return <SensorySearchEngine {...props} />; return <ClientProDetails pro={props.selectedPro} onBack={() => props.setView(ViewState.CLIENT_SEARCH)} onBook={props.onStartBooking || (() => { })} onToggleFavorite={props.onToggleFavorite} isFavorite={props.user.favorites?.includes(props.selectedPro.id)} />;
        case ViewState.CLIENT_MARKET: return <ClientMarket {...props} setView={props.setView} addToCart={props.addToCart} />;
        case ViewState.CLIENT_JOURNEY: return <ClientJourney {...props} />;
        case ViewState.CLIENT_METRICS: return <ClientMetrics {...props} />;
        case ViewState.CLIENT_PROFILE: return <ClientHistory {...props} />;
        case ViewState.CLIENT_CALENDAR: return <ClientHistory {...props} />;
        case ViewState.CLIENT_CHAT: return <ClientChat {...props} />;
        default: return <ClientHome {...props} />;
    }
};