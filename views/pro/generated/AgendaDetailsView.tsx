import React from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { PortalView } from '../../../components/Common';
import { Calendar, Clock, User, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function AgendaDetailsView() {
    const { back, go } = useGuardiaoFlow();

    // Mock Data for the selected appointment
    const appointment = {
        id: 1,
        client: '',  // Populated from selectedAppointment
        service: 'Reiki à Distância',
        date: 'Hoje',
        time: '14:00',
        status: 'confirmed',
        notes: 'Paciente relatou ansiedade e insônia.'
    };

    return (
        <PortalView 
            title="Detalhes do Ritual" 
            subtitle="AGENDAMENTO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800"
        >
            <div className="space-y-6 px-2">
                <div className="bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-4 border-b border-nature-50 pb-4">
                        <div className="w-16 h-16 bg-nature-900 text-white rounded-2xl flex items-center justify-center font-serif italic text-xl">AS</div>
                        <div>
                            <h3 className="font-bold text-nature-900 text-lg">{appointment.client}</h3>
                            <p className="text-xs text-nature-400 font-bold uppercase tracking-widest">Paciente Recorrente</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-nature-50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-nature-400 mb-1"><Calendar size={14}/> <span className="text-[10px] font-bold uppercase">Data</span></div>
                            <p className="font-bold text-nature-900">{appointment.date}</p>
                        </div>
                        <div className="bg-nature-50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-nature-400 mb-1"><Clock size={14}/> <span className="text-[10px] font-bold uppercase">Horário</span></div>
                            <p className="font-bold text-nature-900">{appointment.time}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nature-400">Serviço</p>
                        <div className="p-4 border border-nature-100 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="font-bold text-nature-700">{appointment.service}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nature-400">Notas Prévias</p>
                        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3 text-nature-600 text-sm italic">
                            <FileText size={16} className="shrink-0 mt-1 text-amber-400"/>
                            "{appointment.notes}"
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={back} className="flex-1 py-4 bg-white border border-nature-100 text-rose-500 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        <XCircle size={16}/> Cancelar
                    </button>
                    <button onClick={() => go('VIDEO_SESSION')} className="flex-1 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2">
                        <CheckCircle2 size={16}/> Iniciar Sessão
                    </button>
                </div>
            </div>
        </PortalView>
    );
}
