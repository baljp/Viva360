import React, { useState } from 'react';
import { UserRole } from '../types';
import { Settings, User, Monitor, Zap, RotateCcw } from 'lucide-react';

interface DebugMenuProps {
    onSwitchRole: (role: UserRole) => void;
    onReset: () => void;
    currentRole: UserRole;
    userPoints: number;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ onSwitchRole, onReset, currentRole, userPoints }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-md text-white p-3 rounded-full shadow-lg hover:bg-black transition-all border border-white/20 animate-in fade-in"
                title="Simulador Viva360"
            >
                <Settings size={20} className="animate-spin-slow" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-black/90 backdrop-blur-xl text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 w-72 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-nature-300">
                    <Monitor size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Simulador</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                    <span className="text-xs font-bold">FECHAR</span>
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3 block">Alternar Persona (Role)</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onSwitchRole(UserRole.CLIENT)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all border ${currentRole === UserRole.CLIENT ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/10 border-white/5 text-nature-300 hover:bg-white/20'}`}
                        >
                            Cliente
                        </button>
                        <button
                            onClick={() => onSwitchRole(UserRole.PROFESSIONAL)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all border ${currentRole === UserRole.PROFESSIONAL ? 'bg-amber-600 border-amber-500 text-white' : 'bg-white/10 border-white/5 text-nature-300 hover:bg-white/20'}`}
                        >
                            Pro
                        </button>
                        <button
                            onClick={() => onSwitchRole(UserRole.SPACE)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all border ${currentRole === UserRole.SPACE ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/10 border-white/5 text-nature-300 hover:bg-white/20'}`}
                        >
                            Espaço
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2 block">Estado Global</label>
                    <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Zap size={14} className="text-yellow-400" />
                        <span className="text-xs text-nature-200">Gamificação: <span className="text-white font-bold">{userPoints} pts</span></span>
                    </div>
                    <button
                        onClick={onReset}
                        className="w-full mt-2 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <RotateCcw size={12} /> Resetar Dados (App)
                    </button>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-[10px] text-white/30">Viva360 v2.1.0 • Dev Build</p>
            </div>
        </div>
    );
};
