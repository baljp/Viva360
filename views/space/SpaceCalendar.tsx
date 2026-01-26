import React, { useState } from 'react';
import { Filter, Users, MapPin } from 'lucide-react';
import { ViewState, Professional } from '../../types';
import { PortalView } from '../../components/Common';

interface SpaceCalendarProps {
    team: Professional[];
    setView: (v: ViewState) => void;
}

export const SpaceCalendar: React.FC<SpaceCalendarProps> = ({ team, setView }) => {
     const [filterPro, setFilterPro] = useState<string>('all');
     
     // Mock appointments for demo (since we don't have a full appointments endpoint in this file yet)
     // In real app, use api.spaces.getAppointments(user.id)
     const mockAppointments = [
         { id: '1', time: '09:00', client: 'Ana Silva', proId: team[0]?.id, proName: team[0]?.name || 'Mestre 1', status: 'confirmed', room: 'Sala Hera' },
         { id: '2', time: '10:30', client: 'Carlos B.', proId: team[0]?.id, proName: team[0]?.name || 'Mestre 1', status: 'pending', room: 'Sala Zeus' },
         { id: '3', time: '14:00', client: 'Julia M.', proId: team[1]?.id, proName: team[1]?.name || 'Mestre 2', status: 'confirmed', room: 'Sala Gaia' },
     ];

     const filteredApps = filterPro === 'all' ? mockAppointments : mockAppointments.filter(mock => mock.proId === filterPro);

     return (
        <PortalView 
            title="Agenda do Santuário" 
            subtitle="VISÃO UNIFICADA" 
            onBack={() => setView(ViewState.SPACE_HOME)}
            footer={
                <div className="flex gap-2">
                     <button className="flex-1 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px]">Novo Agendamento</button>
                     <button className="p-4 bg-white border border-nature-100 rounded-2xl text-nature-400"><Filter size={20}/></button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl border border-nature-100 shadow-sm">
                    <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 mb-2 block">Filtrar por Guardião</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        <button 
                            onClick={() => setFilterPro('all')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterPro === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-nature-50 text-nature-500 border-nature-100'}`}
                        >
                            Todos
                        </button>
                        {team.map((t: any) => (
                             <button 
                                key={t.id}
                                onClick={() => setFilterPro(t.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${filterPro === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-nature-50 text-nature-500 border-nature-100'}`}
                            >
                                {t.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Hoje, {new Date().toLocaleDateString('pt-BR')}</h4>
                    {filteredApps.length === 0 ? (
                        <div className="p-10 text-center opacity-50">Nenhum agendamento encontrado para este filtro.</div>
                    ) : filteredApps.map((app: any) => (
                        <div key={app.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 flex gap-4 items-center shadow-sm relative overflow-hidden group">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500"></div>
                             <div className="pl-4">
                                <p className="text-xl font-serif italic text-nature-900">{app.time}</p>
                                <p className="text-[9px] font-bold uppercase text-nature-300">60 min</p>
                             </div>
                             <div className="flex-1 border-l border-nature-100 pl-4 bg-nature-50/50 rounded-r-2xl py-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-nature-900 text-sm">{app.client}</h4>
                                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-lg ${app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{app.status}</span>
                                </div>
                                <p className="text-[10px] text-nature-500 mt-1 flex items-center gap-1"><Users size={10}/> {app.proName}</p>
                                <p className="text-[10px] text-indigo-500 mt-0.5 flex items-center gap-1 font-bold"><MapPin size={10}/> {app.room}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </PortalView>
     );
}
