import React, { useState } from 'react';
import { Vacancy } from '../types';
import { Plus, X, MapPin, Clock, Users, Briefcase, CheckCircle2, ChevronRight } from 'lucide-react';
import { NanoButton, NanoCard } from './common/NanoComponents';

interface VacancyManagerProps {
    vacancies: Vacancy[];
    onCreate: (vacancy: Omit<Vacancy, 'id' | 'createdAt' | 'applicantsCount' | 'status'>) => void;
    onClose: () => void;
}

export const VacancyManager: React.FC<VacancyManagerProps> = ({ vacancies, onCreate, onClose }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [newVacancy, setNewVacancy] = useState({
        title: '',
        description: '',
        schedule: '',
        specialties: [] as string[],
        type: 'fixed' as 'fixed' | 'temporary' | 'event',
        modality: 'presencial' as 'presencial' | 'online',
        split: '',
        hubId: 'current-hub-id', // Mock
        isInviteOnly: false
    });

    const handleCreate = () => {
        onCreate(newVacancy);
        setView('list');
    };

    if (view === 'create') {
        return (
            <div className="fixed inset-0 z-[160] bg-nature-50 flex flex-col animate-in slide-in-from-bottom duration-300">
                <header className="p-6 bg-white border-b border-nature-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif italic text-nature-900">Nova Vaga</h2>
                        <p className="text-[10px] text-nature-400 uppercase tracking-widest font-bold">Recrutamento</p>
                    </div>
                    <button onClick={() => setView('list')}><X className="text-nature-400" /></button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">Título da Vaga</label>
                        <input 
                            value={newVacancy.title}
                            onChange={e => setNewVacancy({...newVacancy, title: e.target.value})}
                            placeholder="Ex: Terapeuta Holístico para Sala Terra"
                            className="w-full p-4 bg-white border border-nature-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">Tipo</label>
                            <select 
                                value={newVacancy.type}
                                onChange={e => setNewVacancy({...newVacancy, type: e.target.value as any})}
                                className="w-full p-4 bg-white border border-nature-200 rounded-2xl outline-none"
                            >
                                <option value="fixed">Fixo (Residente)</option>
                                <option value="temporary">Temporário</option>
                                <option value="event">Evento / Workshop</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">Modalidade</label>
                            <select 
                                value={newVacancy.modality}
                                onChange={e => setNewVacancy({...newVacancy, modality: e.target.value as any})}
                                className="w-full p-4 bg-white border border-nature-200 rounded-2xl outline-none"
                            >
                                <option value="presencial">Presencial</option>
                                <option value="online">Online</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">Acordo (Repasse/Valor)</label>
                        <input 
                            value={newVacancy.split}
                            onChange={e => setNewVacancy({...newVacancy, split: e.target.value})}
                            placeholder="Ex: 70/30 ou R$ 50,00/h"
                            className="w-full p-4 bg-white border border-nature-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">Horários</label>
                        <input 
                            value={newVacancy.schedule}
                            onChange={e => setNewVacancy({...newVacancy, schedule: e.target.value})}
                            placeholder="Ex: Segundas e Quartas, 09h às 18h"
                            className="w-full p-4 bg-white border border-nature-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-nature-700 uppercase tracking-wider">Descrição Humana</label>
                        <textarea 
                            value={newVacancy.description}
                            onChange={e => setNewVacancy({...newVacancy, description: e.target.value})}
                            placeholder="Descreva o perfil que busca com acolhimento..."
                            className="w-full p-4 h-32 bg-white border border-nature-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-100 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white border border-nature-200 rounded-2xl">
                        <input 
                            type="checkbox"
                            checked={newVacancy.isInviteOnly}
                            onChange={e => setNewVacancy({...newVacancy, isInviteOnly: e.target.checked})}
                            className="w-5 h-5 text-nature-900 rounded focus:ring-nature-500"
                        />
                        <div>
                            <p className="font-bold text-nature-900 text-sm">Vaga por Convite</p>
                            <p className="text-xs text-nature-400">Não aparecerá na busca pública</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-nature-100">
                    <NanoButton onClick={handleCreate} className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-nature-900 text-white shadow-xl shadow-nature-900/10">
                        Publicar Vaga
                    </NanoButton>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] bg-nature-50 flex flex-col animate-in slide-in-from-right duration-300">
            <header className="p-6 bg-white border-b border-nature-100 flex items-center gap-4">
                <button onClick={onClose}><X className="text-nature-400" /></button>
                <div>
                    <h2 className="text-xl font-serif italic text-nature-900">Vagas do Santuário</h2>
                    <p className="text-[10px] text-nature-400 uppercase tracking-widest font-bold">Gestão de Talentos</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div 
                    onClick={() => setView('create')}
                    className="p-6 bg-white border-2 border-dashed border-nature-200 rounded-[2rem] flex items-center justify-center gap-3 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer group"
                >
                    <div className="p-2 bg-nature-50 rounded-full group-hover:bg-primary-50 transition-colors"><Plus size={20} /></div>
                    <span className="text-sm font-bold uppercase tracking-wide text-nature-400 group-hover:text-primary-600">Criar Nova Vaga</span>
                </div>

                {vacancies.map(vacancy => (
                    <NanoCard key={vacancy.id} className="p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-nature-900 text-lg">{vacancy.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-nature-100 text-nature-600 rounded-full text-[9px] font-bold uppercase tracking-widest">{vacancy.type}</span>
                                    {vacancy.isInviteOnly && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-widest">Privada</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${vacancy.status === 'open' ? 'text-emerald-600' : 'text-nature-400'}`}>
                                    {vacancy.status === 'open' ? 'Aberta' : 'Fechada'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-nature-500 text-xs">
                                <Briefcase size={14} />
                                <span>{vacancy.split}</span>
                            </div>
                            <div className="flex items-center gap-2 text-nature-500 text-xs">
                                <Clock size={14} />
                                <span className="truncate">{vacancy.schedule}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-nature-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-primary-400" />
                                <span className="text-sm font-bold text-nature-900">{vacancy.applicantsCount} Candidatos</span>
                            </div>
                            <button className="text-xs font-bold text-nature-400 uppercase tracking-widest group-hover:text-primary-600 transition-colors flex items-center gap-1">
                                Gerenciar <ChevronRight size={14} />
                            </button>
                        </div>
                    </NanoCard>
                ))}
            </div>
        </div>
    );
};
