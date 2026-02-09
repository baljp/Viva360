import React, { useEffect, useMemo, useState } from 'react';
import { X, Sun } from 'lucide-react';
import { User as UserType } from '../../types';
import { getDailyWisdom } from '../../src/utils/dailyWisdom';

export const DailyBlessing: React.FC<{ user: UserType, onCheckIn: (reward: number) => Promise<{ ok: boolean; alreadyDone?: boolean } | void> }> = ({ user, onCheckIn }) => {
    const [dismissed, setDismissed] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const lastCheckInDate = user.lastCheckIn ? user.lastCheckIn.split('T')[0] : null;
    const claimStorageKey = useMemo(() => `viva360.daily-blessing.claimed.${user.id}.${today}`, [user.id, today]);
    const [claimedToday, setClaimedToday] = useState(() => localStorage.getItem(claimStorageKey) === '1');
    useEffect(() => {
        setClaimedToday(localStorage.getItem(claimStorageKey) === '1');
    }, [claimStorageKey]);
    
    // Deterministic wisdom for today
    const wisdom = getDailyWisdom(user.id, user.karma);

    const handleReceiveBlessing = async () => {
        if (claiming) return;
        setClaiming(true);
        const previousClaim = claimedToday;
        setClaimedToday(true);
        try {
            const result = await onCheckIn(wisdom.reward);
            const succeeded = !result || Boolean((result as any).ok);
            if (succeeded) {
                localStorage.setItem(claimStorageKey, '1');
                return;
            }
            setClaimedToday(previousClaim);
            localStorage.removeItem(claimStorageKey);
        } catch {
            setClaimedToday(previousClaim);
            localStorage.removeItem(claimStorageKey);
        } finally {
            setClaiming(false);
        }
    };

    if (lastCheckInDate === today || dismissed || claimedToday) return null;

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
                        onClick={handleReceiveBlessing}
                        disabled={claiming}
                        className="px-6 py-2.5 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {claiming ? 'Sincronizando...' : 'Receber Benção'}
                    </button>
                </div>
            </div>
        </div>
    );
}
