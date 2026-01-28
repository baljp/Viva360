import React from 'react';
import { Activity, DoorOpen, Clock, MoreVertical, Plus } from 'lucide-react';
import { ViewState, SpaceRoom } from '../../types';
import { PortalView } from '../../components/Common';

interface SpaceRoomsProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    rooms: SpaceRoom[];
    flow: any;
}

export const SpaceRooms: React.FC<SpaceRoomsProps> = ({ view, setView, rooms, flow }) => {
    return (
        <PortalView title="Altares" subtitle="GESTÃO DE AMBIENTES" onBack={() => flow.go('EXEC_DASHBOARD')}>
            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Total Salas</p>
                    <h4 className="text-2xl font-serif italic text-nature-900">{rooms.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
                    <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Disponíveis</p>
                    <h4 className="text-2xl font-serif italic text-emerald-600">{rooms.filter(r => r.status === 'available').length}</h4>
                </div>
                </div>

                <div className="space-y-4">
                {rooms.map(room => (
                    <div key={room.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${room.status === 'occupied' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {room.status === 'occupied' ? <Activity size={24} className="animate-pulse" /> : <DoorOpen size={24}/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900 text-sm leading-tight">{room.name}</h4>
                            <p className={`text-[10px] font-bold uppercase mt-1 ${room.status === 'occupied' ? 'text-indigo-400' : 'text-emerald-500'}`}>
                                {room.status === 'occupied' ? `Ocupada: ${room.currentOccupant}` : 'Pronta para Ritual'}
                            </p>
                        </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                        {room.status === 'occupied' && (
                            <div className="flex items-center gap-1 text-[10px] text-nature-400 font-bold"><Clock size={12}/> 25m restantes</div>
                        )}
                        <button className="p-2 text-nature-300 hover:text-nature-900 transition-colors"><MoreVertical size={18}/></button>
                        </div>
                    </div>
                ))}
                <button className="w-full py-5 border-2 border-dashed border-nature-100 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all"><Plus size={16}/> Adicionar Novo Altar</button>
                </div>
            </div>
        </PortalView>
    );
};
