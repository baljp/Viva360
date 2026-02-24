import React, { useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { PortalView } from '../../../components/Common';
import { Share2, Copy, Shield, Sprout, Crown, Check, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';
import { runConfirmedAction } from '../../../src/utils/runConfirmedAction';

export default function SpaceInvite() {
    const { back, notify } = useSantuarioFlow();
    const [selectedRole, setSelectedRole] = useState<'Guardian' | 'Facilitator' | 'Master'>('Guardian');
    const [inviteCode, setInviteCode] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const roleMap: Record<string, string> = { Guardian: 'GUARDIAN', Facilitator: 'MEMBER', Master: 'ADMIN' };

    const generateInvite = async () => {
        setLoading(true); setInviteCode('');
        try {
            await runConfirmedAction({
                action: () => api.spaces.createInvite({ role: roleMap[selectedRole], uses: 1 }),
                validateResult: (data) => !!(data as any)?.code,
                notify,
                failToast: {
                    title: 'Erro',
                    message: (err) => (err as any)?.message || 'Falha ao gerar convite',
                    type: 'error',
                },
                onSuccess: ({ result }) => {
                    setInviteCode(String((result as any).code));
                },
            });
        } finally { setLoading(false); }
    };

    const handleCopy = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
        notify('Copiado', 'Código copiado para a área de transferência', 'success');
    };

    const handleShareWhatsapp = async () => {
        if (!inviteCode) return;
        if (shareLoading) return;
        setShareLoading(true);
        try {
            const rolePt = selectedRole === 'Guardian' ? 'Guardião' : selectedRole === 'Facilitator' ? 'Facilitador' : 'Mestre';
            await runConfirmedAction({
                action: () => api.invites.create({ kind: 'space', targetRole: 'PROFESSIONAL', contextRef: inviteCode } as any),
                validateResult: (invite) => !!(invite as any)?.url,
                notify,
                failToast: {
                    title: 'Erro',
                    message: 'Falha ao gerar link de convite',
                    type: 'error',
                },
                onSuccess: ({ result }) => {
                    const url = String((result as any).url);
                    const text = `🌿 Convite Viva360\n\nVocê foi convidado para integrar o Santuário como *${rolePt}*.\n\nAcesse aqui: ${url}\n\n(Código de backup: *${inviteCode}*)`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                },
            });
        } finally {
            setShareLoading(false);
        }
    };

    return (
        <PortalView title="Expandir Círculo" subtitle="CONVITE" onBack={back}
            heroImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800">
            <div className="px-4 pb-24 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Guardian', pt: 'Guardião', icon: Shield },
                        { label: 'Facilitator', pt: 'Facilitador', icon: Sprout },
                        { label: 'Master', pt: 'Mestre', icon: Crown }
                    ].map((role) => (
                        <button key={role.label}
                            onClick={() => { setSelectedRole(role.label as any); setInviteCode(''); }}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedRole === role.label ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-nature-100'}`}>
                            <role.icon size={20} className={selectedRole === role.label ? 'text-indigo-600' : 'text-nature-300'} />
                            <span className={`text-[9px] font-bold uppercase ${selectedRole === role.label ? 'text-indigo-900' : 'text-nature-500'}`}>{role.pt}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-nature-100 shadow-xl text-center space-y-6">
                    <div>
                        <h3 className="font-serif italic text-2xl text-nature-900 mb-2">Código de Acesso</h3>
                        <p className="text-sm text-nature-500">{inviteCode ? `Compartilhe este código com o ${selectedRole === 'Guardian' ? 'Guardião' : selectedRole === 'Facilitator' ? 'Facilitador' : 'Mestre'}.` : 'Selecione o perfil e gere um código único.'}</p>
                    </div>
                    {inviteCode ? (
                        <div className="p-4 bg-nature-50 rounded-2xl border border-nature-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-indigo-200 transition-all" onClick={handleCopy}>
                            <span className="font-mono text-xl font-bold text-nature-900 tracking-widest">{inviteCode}</span>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-nature-400 group-hover:text-indigo-600'}`}>
                                {copied ? <Check size={20}/> : <Copy size={20}/>}
                            </div>
                        </div>
                    ) : (
                        <button onClick={generateInvite} disabled={loading}
                            className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:bg-nature-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw size={18} /> Gerar Código</>}
                        </button>
                    )}
                    {inviteCode && (
                        <>
                            <button onClick={handleShareWhatsapp} disabled={shareLoading} className="w-full py-5 bg-[#25D366] text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[#25D366]/20 hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                                <Share2 size={18} /> Compartilhar no WhatsApp
                            </button>
                            <button onClick={() => setInviteCode('')} className="text-xs font-bold text-nature-400 uppercase tracking-widest hover:text-nature-600">Gerar novo código</button>
                        </>
                    )}
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
