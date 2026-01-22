import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, MessageSquare, ChevronRight, MapPin } from 'lucide-react';
import { Appointment } from '../types';
import { DynamicAvatar, Card } from './Common';

interface AgendaWidgetProps {
    appointments: Appointment[];
    onConfirm: (id: string) => void;
    onCancel: (id: string) => void;
    onViewRecord: (clientId: string) => void;
}

export const AgendaWidget: React.FC<AgendaWidgetProps> = ({ appointments, onConfirm, onCancel, onViewRecord }) => {
    // Sort by time/date
    const sorted = [...appointments].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    const upcoming = sorted.filter(a => a.status === 'confirmed' || a.status === 'pending').slice(0, 3);

    return (
        <Card className="p-6 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-serif italic text-nature-900 flex items-center gap-2">
                        <Calendar size={20} className="text-primary-500" /> Agenda Viva
                    </h3>
                    <p className="text-xs text-nature-400 mt-1">Próximos atendimentos</p>
                </div>
                <button className="text-[10px] font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full">Ver Tudo</button>
            </div>

            <div className="space-y-4">
                {upcoming.length === 0 ? (
                    <div className="text-center py-8 text-nature-300 italic text-sm">Sua agenda está livre como o vento.</div>
                ) : (
                    upcoming.map(apt => (
                        <div key={apt.id} className="relative group">
                            <div className="flex items-start gap-4 p-4 rounded-[2rem] border border-nature-100 bg-white transition-all hover:shadow-md hover:border-primary-100">
                                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <span className="text-xs font-bold text-nature-900">{apt.time}</span>
                                    <div className="h-8 w-0.5 bg-nature-100 rounded-full"></div>
                                </div>
                                
                                <div className="flex-1" onClick={() => onViewRecord(apt.clientId)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                                            <span className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">{apt.serviceName}</span>
                                        </div>
                                        {apt.status === 'pending' && <span className="text-[8px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase">Pendente</span>}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                        <DynamicAvatar user={{ name: apt.clientName, avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${apt.clientId}` }} size="sm" />
                                        <div>
                                            <h4 className="font-bold text-nature-900 text-sm">{apt.clientName}</h4>
                                            <div className="flex items-center gap-1 text-[10px] text-nature-400">
                                                <MapPin size={10} /> Online
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {apt.status === 'pending' ? (
                                        <>
                                            <button onClick={() => onConfirm(apt.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"><CheckCircle2 size={18}/></button>
                                            <button onClick={() => onCancel(apt.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><XCircle size={18}/></button>
                                        </>
                                    ) : (
                                        <button onClick={() => onViewRecord(apt.clientId)} className="p-2 bg-nature-50 text-nature-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                            <ChevronRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};
