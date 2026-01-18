import React, { useState, useEffect } from 'react';
import { Leaf, Wind, CheckCircle, AlertCircle, Sparkles, ShieldCheck, UploadCloud, ChevronDown, ChevronUp, X, Sprout, Flower, Sun, Droplets, Moon, WifiOff, AlertTriangle, Calendar, Bell } from 'lucide-react';
import { GardenPhase, ToastMessage } from '../types';

// --- ZEN TOAST (Floating Feedback) ---
export const ZenToast: React.FC<{ toast: ToastMessage | null; onClose: () => void }> = ({ toast, onClose }) => {
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(onClose, toast.duration || 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, onClose]);

    if (!toast) return null;

    const bgColors = {
        success: 'bg-primary-600 text-white', // Sage Green
        error: 'bg-rose-100 text-rose-800 border border-rose-200', // Soft Terracotta
        info: 'bg-blue-50 text-blue-800 border border-blue-100', // Serene Blue
        neutral: 'bg-nature-800 text-white' // Dark Stone
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-in slide-in-from-top-4 duration-500">
            <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 ${bgColors[toast.type]}`}>
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <AlertCircle size={20} />}
                {toast.type === 'info' && <Sparkles size={20} />}
                {toast.type === 'neutral' && <Leaf size={20} />}

                <div className="flex-1">
                    <h4 className="font-bold text-sm">{toast.title}</h4>
                    {toast.message && <p className="text-xs opacity-90">{toast.message}</p>}
                </div>
                <button onClick={onClose} aria-label="Fechar notificação"><X size={16} /></button>
            </div>
        </div>
    );
};

// --- ORGANIC SKELETON (Pulsing Shimmer) ---
export const OrganicSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-nature-100 rounded-3xl ${className}`}></div>
);

export const SkeletonCard = () => (
    <div className="bg-white p-5 rounded-[2.5rem] border border-nature-50 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="space-y-2 w-2/3">
                <OrganicSkeleton className="h-6 w-3/4 rounded-xl" />
                <OrganicSkeleton className="h-4 w-1/2 rounded-lg" />
            </div>
            <OrganicSkeleton className="w-8 h-8 rounded-full" />
        </div>
        <OrganicSkeleton className="h-12 w-full rounded-2xl mt-2" />
    </div>
);

// --- OFFLINE STATE (Resilience) ---
export const OfflineState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full animate-in fade-in duration-1000">
        <div className="w-32 h-32 bg-nature-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-nature-200">
            <WifiOff size={40} className="text-nature-400" />
        </div>
        <h3 className="text-xl font-light text-nature-800 mb-2">Estamos desconectados</h3>
        <p className="text-sm text-nature-500 max-w-xs mb-8 leading-relaxed">
            Aproveite para respirar fundo. Estamos tentando reconectar você ao jardim.
        </p>
        <button
            onClick={onRetry}
            className="bg-nature-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg"
        >
            Tentar Reconectar
        </button>
    </div>
);

// --- ZEN ERROR (Soft Failure) ---
export const ZenError: React.FC<{ title?: string; message?: string; onAction?: () => void; actionLabel?: string }> = ({
    title = "Pequeno Desvio",
    message = "Algo não saiu como esperado. Vamos tentar novamente com calma?",
    onAction,
    actionLabel = "Tentar Novamente"
}) => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-300">
            <AlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-medium text-rose-900 mb-2">{title}</h3>
        <p className="text-sm text-rose-700/70 max-w-xs mb-6 leading-relaxed">{message}</p>
        {onAction && (
            <button
                onClick={onAction}
                className="bg-white border border-rose-200 text-rose-700 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-rose-50 transition-all"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

// --- VERIFIED BADGE (Trust & Safety) ---
export const VerifiedBadge: React.FC<{ size?: number, showLabel?: boolean }> = ({ size = 16, showLabel = false }) => (
    <div className="inline-flex items-center gap-1" title="Identidade verificada pela Viva360">
        <div className="relative">
            <Leaf size={size} className="text-primary-600 fill-primary-600" />
            <CheckCircle size={size * 0.5} className="absolute bottom-0 right-0 text-white fill-nature-50 bg-nature-900 rounded-full" strokeWidth={3} />
        </div>
        {showLabel && <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">Verificado</span>}
    </div>
);

// --- GROWTH GARDEN COMPONENT ---
// Replaces Progress Bar with Generative/Stateful Plant Logic
export const GrowthGarden: React.FC<{ streak: number; lastActive?: string }> = ({ streak, lastActive }) => {
    // 1. Calculate Phase based on Streak and Absence
    let phase = GardenPhase.SEED;
    let isDormant = false;

    if (lastActive) {
        const daysSinceActive = (new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 3600 * 24);
        if (daysSinceActive > 5) {
            isDormant = true;
            phase = GardenPhase.DORMANT;
        } else {
            if (streak >= 7) phase = GardenPhase.FLOWER;
            else if (streak >= 3) phase = GardenPhase.PLANT;
            else if (streak >= 1) phase = GardenPhase.SPROUT;
        }
    }

    // 2. Visual Logic (SVG Generation)
    const renderPlant = () => {
        switch (phase) {
            case GardenPhase.DORMANT:
                return (
                    <div className="flex flex-col items-center justify-end h-32 relative animate-in fade-in duration-1000">
                        {/* Dormant: Muted colors, drooping */}
                        <svg viewBox="0 0 100 100" className="w-24 h-24 text-nature-400 opacity-60">
                            <path d="M50 100 Q50 60 70 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            <path d="M70 50 Q80 55 85 65" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> {/* Drooping Leaf */}
                            <path d="M50 80 Q30 70 25 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> {/* Drooping Leaf */}
                        </svg>
                        <p className="text-[10px] text-nature-400 mt-2 font-medium tracking-wide">Em repouso</p>
                    </div>
                );
            case GardenPhase.FLOWER:
                return (
                    <div className="flex flex-col items-center justify-end h-44 relative animate-in zoom-in duration-[2000ms]">
                        {/* Sun/Glow with slow spin */}
                        <div className="absolute -top-2 -right-2 animate-[spin_12s_linear_infinite] text-amber-200 opacity-60"><Sun size={64} /></div>

                        {/* ACHIEVEMENT BADGE - Only visible in Flower State */}
                        <div className="absolute -top-4 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-amber-200 whitespace-nowrap animate-[bounce_3s_infinite] z-20 flex items-center gap-1.5">
                            <Sparkles size={10} className="text-amber-600 fill-amber-600" />
                            <span>7 dias de paz interior</span>
                        </div>

                        <svg viewBox="0 0 100 100" className="w-32 h-32 text-primary-600 drop-shadow-sm z-10 overflow-visible">
                            <path d="M50 100 L50 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

                            {/* Big Leaves */}
                            <path d="M50 80 Q80 70 90 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-in slide-in-from-bottom-4 duration-1000" />
                            <path d="M50 70 Q20 60 10 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-in slide-in-from-bottom-4 duration-1000 delay-100" />

                            {/* Blooming Flower Head */}
                            <g className="origin-[50px_40px] animate-[pulse_3s_infinite]">
                                {/* Petals Layer 1 */}
                                <circle cx="50" cy="25" r="10" className="fill-pink-200 stroke-none opacity-90" />
                                <circle cx="65" cy="35" r="10" className="fill-pink-200 stroke-none opacity-90" />
                                <circle cx="60" cy="50" r="10" className="fill-pink-200 stroke-none opacity-90" />
                                <circle cx="40" cy="50" r="10" className="fill-pink-200 stroke-none opacity-90" />
                                <circle cx="35" cy="35" r="10" className="fill-pink-200 stroke-none opacity-90" />

                                {/* Inner Petals / Detail */}
                                <circle cx="50" cy="30" r="6" className="fill-pink-300 stroke-none opacity-80" />
                                <circle cx="60" cy="40" r="6" className="fill-pink-300 stroke-none opacity-80" />
                                <circle cx="40" cy="40" r="6" className="fill-pink-300 stroke-none opacity-80" />

                                {/* Core */}
                                <circle cx="50" cy="40" r="7" className="fill-amber-300 stroke-none" />
                            </g>
                        </svg>
                        <p className="text-[10px] text-primary-700 mt-1 font-bold tracking-wide uppercase">Jardim Completo</p>
                    </div>
                );
            case GardenPhase.PLANT:
                return (
                    <div className="flex flex-col items-center justify-end h-32 relative animate-in slide-in-from-bottom duration-[1500ms]">
                        <svg viewBox="0 0 100 100" className="w-20 h-20 text-primary-500">
                            <path d="M50 100 Q50 50 50 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            <path d="M50 70 Q80 60 80 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> {/* Right Leaf */}
                            <path d="M50 50 Q20 40 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> {/* Left Leaf */}
                        </svg>
                        <p className="text-[10px] text-primary-600 mt-2 font-medium tracking-wide">Crescendo</p>
                    </div>
                );
            case GardenPhase.SPROUT:
            default:
                return (
                    <div className="flex flex-col items-center justify-end h-32 relative animate-in fade-in duration-1000">
                        <svg viewBox="0 0 100 100" className="w-16 h-16 text-primary-400">
                            <path d="M50 100 Q50 70 60 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            <path d="M60 60 Q70 50 80 55" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> {/* Small Leaf */}
                        </svg>
                        <p className="text-[10px] text-primary-500 mt-2 font-medium tracking-wide">Brotando</p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full flex justify-center py-4 bg-gradient-to-t from-primary-50/50 to-transparent rounded-[3rem] transition-all duration-1000">
            {renderPlant()}
        </div>
    );
};

// --- FILE UPLOAD PLACEHOLDER ---
export const FileUpload: React.FC<{ label: string, sub?: string }> = ({ label, sub }) => (
    <div className="border-2 border-dashed border-nature-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group">
        <div className="w-12 h-12 bg-nature-50 rounded-full flex items-center justify-center text-nature-400 mb-3 group-hover:bg-white group-hover:text-primary-50 transition-colors">
            <UploadCloud size={24} />
        </div>
        <p className="font-medium text-nature-800 text-sm">{label}</p>
        {sub && <p className="text-xs text-nature-400 mt-1">{sub}</p>}
    </div>
);

// --- ACCORDION (Expandable Card) ---
export const Accordion: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, subtitle, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-[2rem] border border-nature-100 shadow-sm overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-nature-50/50 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-4">
                    {icon && <div className="text-nature-400">{icon}</div>}
                    <div>
                        <h4 className="font-semibold text-nature-800 text-sm">{title}</h4>
                        {subtitle && <p className="text-xs text-nature-400">{subtitle}</p>}
                    </div>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-nature-400" /> : <ChevronDown size={20} className="text-nature-400" />}
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 pt-0 border-t border-nature-50">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- TOGGLE SWITCH ---
export const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between py-2 cursor-pointer" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
        {label && <span className="text-sm text-nature-600 font-medium">{label}</span>}
        <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${checked ? 'bg-primary-500' : 'bg-nature-200'}`}>
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

// --- RANGE SLIDER (Nano Banana Style) ---
export const RangeSlider: React.FC<{ value: number; onChange: (val: number) => void; label: string; minLabel?: string; maxLabel?: string }> = ({ value, onChange, label, minLabel, maxLabel }) => (
    <div className="py-2">
        <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-nature-800">{label}</span>
            <span className="text-xs font-bold text-primary-600">{value}%</span>
        </div>
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-nature-200 rounded-full appearance-none cursor-pointer accent-primary-500 hover:accent-primary-600"
            aria-label={label}
        />
        <div className="flex justify-between mt-1 text-[10px] text-nature-400 uppercase tracking-wider">
            <span>{minLabel || 'Baixo'}</span>
            <span>{maxLabel || 'Alto'}</span>
        </div>
    </div>
);

// --- BOTTOM SHEET (Drawer) ---
export const BottomSheet: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white rounded-t-[2.5rem] p-6 w-full max-h-[85vh] overflow-y-auto relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                <div className="w-12 h-1 bg-nature-200 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-light text-nature-800">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-nature-50 rounded-full hover:bg-nature-100 text-nature-500" aria-label="Fechar"><X size={20} /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- EMPTY STATE (Botanical Theme) ---
interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction, icon }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="w-32 h-32 bg-nature-100 rounded-full flex items-center justify-center mb-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-nature-200/50 rounded-full blur-xl scale-0 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="text-nature-400 relative z-10 group-hover:text-primary-500 transition-colors">
                {icon || <Wind size={48} strokeWidth={1} />}
            </div>
            <div className="absolute bottom-4 left-8 text-nature-300 transform rotate-12"><Leaf size={24} /></div>
        </div>
        <h3 className="text-lg font-medium text-nature-800 mb-2">{title}</h3>
        <p className="text-sm text-nature-500 max-w-xs mb-6 leading-relaxed">{description}</p>
        {actionLabel && onAction && (
            <button
                onClick={onAction}
                className="bg-white border border-nature-200 text-nature-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:border-primary-300 hover:text-primary-600 transition-all shadow-sm"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

// --- SUCCESS MODAL (Confetti Zen) ---
interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-nature-900/40 backdrop-blur-sm animate-in fade-in duration-300" role="dialog">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-300">
                {/* Decorative Confetti */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute animate-bounce" style={{
                            top: `${Math.random() * 50}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.2}s`,
                            opacity: 0.3
                        }}>
                            <Leaf size={12} className={i % 2 === 0 ? "text-primary-400" : "text-amber-400"} fill="currentColor" />
                        </div>
                    ))}
                </div>

                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-6 shadow-sm shadow-primary-200">
                    <CheckCircle size={40} strokeWidth={2} />
                </div>

                <h3 className="text-xl font-semibold text-nature-900 mb-2">{title}</h3>
                <p className="text-nature-500 text-sm mb-8 leading-relaxed">{message}</p>

                <button
                    onClick={onClose}
                    className="w-full bg-nature-900 text-white font-medium py-3.5 rounded-xl hover:bg-black transition-colors"
                >
                    Gratidão
                </button>
            </div>
        </div>
    );
};

// --- ADMIN CARD (For Space Management) ---
interface AdminCardProps {
    title: string;
    subtitle?: string;
    actionIcon?: React.ReactNode;
    onAction?: () => void;
    children: React.ReactNode;
}

export const AdminCard: React.FC<AdminCardProps> = ({ title, subtitle, actionIcon, onAction, children }) => (
    <div className="bg-white rounded-[2rem] border border-nature-100 shadow-sm p-5 hover:border-primary-100 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h4 className="font-semibold text-nature-800">{title}</h4>
                {subtitle && <p className="text-xs text-nature-400">{subtitle}</p>}
            </div>
            {onAction && (
                <button onClick={onAction} className="p-2 rounded-full bg-nature-50 text-nature-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" aria-label="Ação">
                    {actionIcon || <Sparkles size={16} />}
                </button>
            )}
        </div>
        {children}
    </div>
);

// --- NOTIFICATION CENTER (Slide-over) ---
export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'appointment' | 'message' | 'system' | 'gift';
}

export const NotificationCenter: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    notifications: NotificationItem[];
    onMarkRead: (id: string) => void;
}> = ({ isOpen, onClose, notifications, onMarkRead }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-[#f8faf9] w-full max-w-sm h-full relative z-10 animate-in slide-in-from-right duration-500 shadow-2xl flex flex-col">
                <div className="p-6 border-b border-nature-100 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-light text-nature-800">Suas <span className="font-semibold">Notificações</span></h3>
                    <button onClick={onClose} className="p-2 hover:bg-nature-50 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length > 0 ? (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => onMarkRead(n.id)}
                                className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${n.read ? 'bg-white border-nature-50 opacity-60' : 'bg-white border-primary-100 shadow-md ring-1 ring-primary-50'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'appointment' ? 'bg-primary-50 text-primary-600' :
                                        n.type === 'message' ? 'bg-blue-50 text-blue-600' :
                                            n.type === 'gift' ? 'bg-amber-50 text-amber-600' : 'bg-nature-50 text-nature-600'
                                        }`}>
                                        {n.type === 'appointment' ? <Calendar size={18} /> :
                                            n.type === 'message' ? <Droplets size={18} /> :
                                                n.type === 'gift' ? <Sparkles size={18} /> : <Droplets size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-nature-800 text-sm">{n.title}</h4>
                                            <span className="text-[10px] text-nature-400 font-medium">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-nature-500 leading-relaxed">{n.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Wind size={48} />
                            <p className="mt-4 text-sm font-medium">Céu limpo por aqui.</p>
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-6 bg-white border-t border-nature-100">
                        <button className="w-full py-4 text-nature-400 text-xs font-bold uppercase tracking-widest hover:text-nature-600 transition-colors">Limpar todas</button>
                    </div>
                )}
            </div>
        </div>
    );
};