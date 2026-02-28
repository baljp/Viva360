
import React from 'react';
import { useGuardiaoFlow } from '../../../src/flow/useGuardiaoFlow';
import { ChevronLeft, FileText, Activity, Calendar, MoreVertical, Shield, MessageCircle } from 'lucide-react';
import { PatientDTO, Appointment } from '../../../types';

export default function PatientProfile() {
    const { go, state } = useGuardiaoFlow();
    const selectedPatient = state.selectedPatient as PatientDTO | undefined;
    const patientName = String(selectedPatient?.name || 'Buscador');
    const patientInitials = patientName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'BS';

    const nextAppointment = (state.data.appointments || []).find((appointment: Appointment) => {
        const clientId = String(appointment?.clientId || '');
        return clientId === String(selectedPatient?.id || '');
    });
    const nextDateLabel = nextAppointment?.date
        ? new Date(String(nextAppointment.date).slice(0, 10)).toLocaleDateString('pt-BR')
        : 'Sem data';

    return (
        <div className="min-h-screen bg-[#fcfdfc] flex flex-col animate-in slide-in-from-right duration-500">
            <div className="bg-nature-900 text-white rounded-b-[3.5rem] p-8 pb-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <header className="flex items-center justify-between mb-8 relative z-10">
                    <button onClick={() => go('PATIENTS_LIST')} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => go('PATIENT_RECORDS')} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all">
                        <MoreVertical size={20} />
                    </button>
                </header>

                <div className="text-center relative z-10">
                    <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto mb-4 flex items-center justify-center text-nature-900 font-serif italic text-3xl shadow-lg">{patientInitials}</div>
                    <h1 className="text-2xl font-serif italic">{patientName}</h1>
                    <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mt-2">
                        {selectedPatient?.sessions
                            ? `Em Jornada · ${selectedPatient.sessions} sessão${selectedPatient.sessions !== 1 ? 'ões' : ''}`
                            : 'Em Jornada'}
                    </p>
                </div>
            </div>

            <div className="flex-1 px-6 -mt-8 relative z-20 space-y-6 pb-24">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-nature-100 text-center shadow-sm">
                        <Activity size={20} className="mx-auto text-rose-500 mb-2" />
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Humor</p>
                        <p className="font-bold text-nature-900">{String(selectedPatient?.mood || '—')}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-nature-100 text-center shadow-sm">
                        <Calendar size={20} className="mx-auto text-indigo-500 mb-2" />
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Próxima</p>
                        <p className="font-bold text-nature-900">{nextDateLabel}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-nature-100 text-center shadow-sm">
                        <Shield size={20} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Karma</p>
                        <p className="font-bold text-nature-900">
                            {selectedPatient?.karma != null
                                ? `${Number(selectedPatient.karma).toLocaleString('pt-BR')}`
                                : '—'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button onClick={() => go('PATIENT_RECORDS')} className="w-full p-5 bg-white rounded-[2rem] border border-nature-100 flex items-center gap-4 hover:border-emerald-200 transition-all shadow-sm group text-left">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900">Prontuário Evolutivo</h4>
                            <p className="text-[10px] text-nature-400 font-bold uppercase">Acessar Histórico</p>
                        </div>
                    </button>

                    <button onClick={() => go('PATIENT_PLAN')} className="w-full p-5 bg-white rounded-[2rem] border border-nature-100 flex items-center gap-4 hover:border-emerald-200 transition-all shadow-sm group text-left">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900">Plano Terapêutico</h4>
                            <p className="text-[10px] text-nature-400 font-bold uppercase">Ver Metas</p>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            const rawPhone = String(selectedPatient?.phone || '').replace(/\D/g, '');
                            const phone = rawPhone.length >= 10
                                ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`)
                                : null;
                            const greeting = `Olá ${patientName.split(' ')[0]}! Sou seu Guardião do Viva360. Como você está se sentindo hoje? 🌱`;
                            const text = encodeURIComponent(greeting);
                            if (phone) {
                                window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                            } else {
                                window.open(`https://wa.me/?text=${text}`, '_blank');
                            }
                        }}
                        className="w-full p-5 bg-[#25D366] text-white rounded-[2rem] flex items-center gap-4 hover:opacity-90 transition-all shadow-md group text-left"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold">Falar no WhatsApp</h4>
                            <p className="text-[10px] font-bold uppercase opacity-80">Contato Direto</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
