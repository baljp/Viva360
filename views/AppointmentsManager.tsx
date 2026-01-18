import React, { useState } from 'react';
import { Appointment, ViewState, UserRole } from '../types';
import { ChevronLeft, Calendar, Clock, MapPin, Video, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentsManagerProps {
    userRole: UserRole;
    appointments: Appointment[];
    onBack: () => void;
    onAction?: (appointmentId: string, action: string) => void;
}

const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({ userRole, appointments, onBack, onAction }) => {
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    const filteredAppointments = appointments.filter(appt => {
        const isPast = new Date(appt.date) < new Date();
        return filter === 'upcoming' ? !isPast : isPast;
    });

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-20">
            <div className="flex items-center gap-4 mb-8 px-2">
                <button onClick={onBack} className="p-2 rounded-full bg-white shadow-sm text-nature-500 hover:text-primary-600">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-2xl font-light text-nature-800">Seus <span className="font-semibold">Agendamentos</span></h2>
            </div>

            <div className="flex bg-nature-100 p-1 rounded-full mx-2 mb-8 relative">
                <button
                    onClick={() => setFilter('upcoming')}
                    className={`flex-1 relative z-10 text-xs font-bold py-2.5 rounded-full transition-colors ${filter === 'upcoming' ? 'bg-white text-primary-700 shadow-sm' : 'text-nature-500'}`}
                >
                    Próximos
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`flex-1 relative z-10 text-xs font-bold py-2.5 rounded-full transition-colors ${filter === 'past' ? 'bg-white text-primary-700 shadow-sm' : 'text-nature-500'}`}
                >
                    Histórico
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-4">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map(appt => (
                        <div key={appt.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${appt.type === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {appt.type === 'online' ? <Video size={20} /> : <MapPin size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-nature-800">{appt.serviceName}</h3>
                                        <p className="text-xs text-nature-500">
                                            {userRole === UserRole.CLIENT ? appt.professionalName : 'Paciente'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${appt.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                        appt.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {appt.status}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-xs text-nature-500 mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-primary-400" />
                                    {new Date(appt.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-primary-400" />
                                    {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            {filter === 'upcoming' && (
                                <div className="flex gap-3">
                                    <button onClick={() => onAction && onAction(appt.id, 'cancel')} className="flex-1 py-3 rounded-xl border border-nature-200 text-nature-400 font-bold text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2">
                                        <XCircle size={14} /> Cancelar
                                    </button>
                                    {appt.type === 'online' && (
                                        <button className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-lg shadow-primary-200/50 hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                                            <Video size={14} /> Acessar Sala
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <Calendar size={48} strokeWidth={1} className="mb-4" />
                        <p className="text-sm">Nenhum agendamento encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentsManager;
