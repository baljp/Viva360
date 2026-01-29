import React, { useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast } from '../../components/Common';
import { Share2, Copy, Shield, Sprout, Crown, Check } from 'lucide-react';

export default function SpaceInvite() {
    const { back } = useSantuarioFlow();
    const [selectedRole, setSelectedRole] = useState<'Guardian' | 'Facilitator' | 'Master'>('Guardian');
    const [copied, setCopied] = useState(false);

    const inviteCodes = {
        Guardian: 'VIVA-GUARD-9921',
        Facilitator: 'VIVA-FACIL-8832',
        Master: 'VIVA-MAST-1102'
    };

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsapp = () => {
        const text = `Olá! Você foi convidado para integrar o Santuário como *${selectedRole}*. Use o código de acesso: *${inviteCodes[selectedRole]}*. Baixe o app e junte-se a nós!`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <PortalView 
            title="Expandir Círculo" 
            subtitle="CONVITE" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800"
        >
            <div className="px-4 pb-24 space-y-6">
                 {/* Role Selection */}
                 <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Guardian', pt: 'Guardião', icon: Shield },
                        { label: 'Facilitator', pt: 'Facilitador', icon: Sprout },
                        { label: 'Master', pt: 'Mestre', icon: Crown }
                    ].map((role) => (
                        <button 
                            key={role.label}
                            onClick={() => setSelectedRole(role.label as any)}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedRole === role.label ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-nature-100'}`}
                        >
                            <role.icon size={20} className={selectedRole === role.label ? 'text-indigo-600' : 'text-nature-300'} />
                            <span className={`text-[9px] font-bold uppercase ${selectedRole === role.label ? 'text-indigo-900' : 'text-nature-500'}`}>{role.pt}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-nature-100 shadow-xl text-center space-y-6">
                    <div>
                        <h3 className="font-serif italic text-2xl text-nature-900 mb-2">Código de Acesso</h3>
                        <p className="text-sm text-nature-500">Compartilhe este código único com o {selectedRole === 'Guardian' ? 'Guardião' : selectedRole === 'Facilitator' ? 'Facilitador' : 'Mestre'}.</p>
                    </div>

                    <div className="p-4 bg-nature-50 rounded-2xl border border-nature-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-indigo-200 transition-all" onClick={handleCopy}>
                        <span className="font-mono text-xl font-bold text-nature-900 tracking-widest">{inviteCodes[selectedRole]}</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-nature-400 group-hover:text-indigo-600'}`}>
                            {copied ? <Check size={20}/> : <Copy size={20}/>}
                        </div>
                    </div>

                    <button 
                        onClick={handleShareWhatsapp}
                        className="w-full py-5 bg-[#25D366] text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#25D366]/20 hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3"
                    >
                        <Share2 size={18} /> Compartilhar no WhatsApp
                    </button>
                </div>

                <div className="bg-indigo-50 p-6 rounded-[2.5rem] text-center">
                    <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                        Ao convidar um novo membro, você se torna o <strong>Padrinho Espiritual</strong> dele, recebendo 5% de Karma bônus sobre os atendimentos realizados nos primeiros 3 meses.
                    </p>
                </div>
            </div>
        </PortalView>
    );  
}
