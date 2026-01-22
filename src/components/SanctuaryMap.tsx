import React from 'react';
import { SpaceRoom } from '../types';
import { Card } from './Common';
import { Home, Users, Zap, Clock, MoreVertical, Edit2, Lock, Unlock } from 'lucide-react';

interface SanctuaryMapProps {
    rooms: SpaceRoom[];
    onRoomClick: (room: SpaceRoom) => void;
    onEditRoom: (room: SpaceRoom) => void;
    onCreateRoom: () => void;
}

export const SanctuaryMap: React.FC<SanctuaryMapProps> = ({ rooms, onRoomClick, onEditRoom, onCreateRoom }) => {
    // Group rooms by status for quick stats
    const freeRooms = rooms.filter(r => r.status === 'available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Stats Bar */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <div className="flex-1 min-w-[120px] bg-nature-900 text-white p-5 rounded-[2rem] shadow-xl shadow-nature-900/10 flex flex-col justify-between relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
                     <p className="text-[9px] font-bold text-nature-300 uppercase tracking-widest relative z-10">Harmonia</p>
                     <div className="flex items-end justify-between relative z-10">
                        <p className="text-3xl font-serif font-medium">98%</p>
                        <Zap size={16} className="text-amber-400 mb-1" />
                     </div>
                </div>

                <div className="flex-1 min-w-[120px] bg-emerald-50 p-4 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Livres</p>
                        <p className="text-2xl font-serif font-medium text-emerald-900">{freeRooms}</p>
                    </div>
                    <Unlock size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-[120px] bg-rose-50 p-4 rounded-[2rem] border border-rose-100 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Ocupadas</p>
                        <p className="text-2xl font-serif font-medium text-rose-900">{occupiedRooms}</p>
                    </div>
                    <Lock size={20} className="text-rose-400" />
                </div>
            </div>

            {/* Grid Map */}
            <div className="grid grid-cols-2 gap-4">
                {rooms.map(room => (
                    <div 
                        key={room.id}
                        onClick={() => onRoomClick(room)}
                        className={`relative p-5 rounded-[2rem] border transition-all duration-300 group hover:shadow-lg active:scale-[0.98] cursor-pointer ${
                            room.status === 'available' 
                                ? 'bg-white border-nature-100 hover:border-emerald-200' 
                                : 'bg-nature-50 border-transparent opacity-90'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                                room.status === 'available' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                            }`}>
                                <Home size={18} />
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEditRoom(room); }}
                                className="p-2 rounded-full hover:bg-black/5 text-nature-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm">{room.name}</h4>
                            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-tight mt-0.5">
                                {room.capacity} Pessoas • {room.resources.length} Itens
                            </p>
                        </div>

                        {room.status === 'occupied' && (
                            <div className="mt-4 pt-3 border-t border-nature-100 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                <span className="text-[9px] font-bold text-nature-500 uppercase truncate">
                                    Ocupado por {room.currentOccupant || 'Mestre'}
                                </span>
                            </div>
                        )}
                        
                        {room.status === 'available' && (
                            <div className="mt-4 pt-3 border-t border-nature-50 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">
                                    Disponível Agora
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
