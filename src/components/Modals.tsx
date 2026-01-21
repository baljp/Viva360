
import React, { useState, useEffect } from 'react';
import { X, Check, Upload, Sparkles, AlertCircle } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 px-2">
                    {title && <h3 className="text-xl font-serif italic text-nature-900">{title}</h3>}
                    <button onClick={onClose} className="p-2 bg-nature-50 rounded-full text-nature-400 hover:text-nature-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export const SimpleActionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => Promise<void>;
}> = ({ isOpen, onClose, title, description, actionLabel, onAction }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAction = async () => {
        setIsLoading(true);
        await onAction();
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 1500);
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center space-y-6 py-4">
                {isSuccess ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <Check size={32} />
                        </div>
                        <p className="text-lg font-bold text-nature-900">Sucesso!</p>
                        <p className="text-xs text-nature-500 uppercase tracking-widest mt-1">Ação realizada com harmonia</p>
                    </div>
                ) : (
                    <>
                        <p className="text-nature-600 leading-relaxed italic px-4">{description}</p>
                        <button 
                            onClick={handleAction} 
                            disabled={isLoading}
                            className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Sparkles size={16} className="animate-spin" /> : null}
                            {isLoading ? "Processando..." : actionLabel}
                        </button>
                    </>
                )}
            </div>
        </BaseModal>
    );
};

export const ImageUploader: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}> = ({ isOpen, onClose, onSelect }) => {
    const [dragActive, setDragActive] = useState(false);

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Nova Imagem">
            <div className="space-y-6">
                <div 
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-nature-200 hover:border-nature-300'}`}
                    onDragEnter={() => setDragActive(true)}
                    onDragLeave={() => setDragActive(false)}
                >
                    <Upload size={32} className="mx-auto text-nature-300 mb-4" />
                    <p className="text-sm font-bold text-nature-900 mb-1">Escolha uma nova imagem</p>
                    <p className="text-[10px] text-nature-400 uppercase tracking-widest">JPG, PNG ou WebP</p>
                </div>
                
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2">Ou escolha um avatar:</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <button 
                                key={i}
                                onClick={() => { onSelect(`https://api.dicebear.com/7.x/notionists/svg?seed=Avatar${i}`); onClose(); }}
                                className="aspect-square rounded-2xl bg-nature-50 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-all p-1"
                            >
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Avatar${i}`} className="w-full h-full rounded-xl" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export const ComingSoonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    feature: string;
}> = ({ isOpen, onClose, feature }) => (
    <BaseModal isOpen={isOpen} onClose={onClose}>
        <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-serif italic text-nature-900">{feature}</h3>
            <p className="text-sm text-nature-500 italic px-4">
                Esta funcionalidade está sendo preparada pelos nossos guardiões e estará disponível na próxima lua cheia.
            </p>
            <button onClick={onClose} className="px-8 py-3 bg-nature-100 text-nature-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-nature-200 transition-colors mt-4">Entendi</button>
        </div>
    </BaseModal>
);
