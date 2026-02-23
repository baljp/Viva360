import React, { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import { ICON_SIZE } from './constants';

export const PortalView: React.FC<{ 
    title: string, 
    subtitle: string, 
    onBack?: () => void, 
    onClose?: () => void,
    showCloseWithBack?: boolean,
    children: React.ReactNode, 
    footer?: React.ReactNode,
    headerRight?: React.ReactNode,
    heroImage?: string
}> = ({ title, subtitle, onBack, onClose, showCloseWithBack = true, children, footer, headerRight, heroImage }) => {
    const resolvedClose = onClose || (showCloseWithBack && onBack ? onBack : undefined);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const previousFocusIdRef = useRef<string | null>(null);
    const titleId = useId();
    const subtitleId = useId();
    const dialogLabel = useMemo(() => `${title} ${subtitle}`.trim(), [title, subtitle]);

    useEffect(() => {
        previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        previousFocusIdRef.current = previousFocusRef.current?.id || null;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusFirst = () => {
            const focusables = dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            (focusables[0] || dialog).focus();
        };
        const raf = requestAnimationFrame(focusFirst);
        return () => {
            cancelAnimationFrame(raf);
            let attempts = 0;
            const restoreFocus = () => {
                attempts += 1;
                const previousEl = previousFocusRef.current;
                if (previousEl && document.contains(previousEl)) {
                    previousEl.focus?.();
                    return;
                }
                const fallbackId = previousFocusIdRef.current;
                const fallbackEl = fallbackId ? document.getElementById(fallbackId) : null;
                if (fallbackEl) {
                    fallbackEl.focus?.();
                    return;
                }
                if (attempts < 5) window.setTimeout(restoreFocus, 25);
            };
            window.setTimeout(restoreFocus, 0);
        };
    }, [title, subtitle]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && resolvedClose) {
            e.preventDefault();
            resolvedClose();
            return;
        }
        if (e.key !== 'Tab') return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusables = Array.from(
            dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);
        if (focusables.length === 0) {
            e.preventDefault();
            dialog.focus();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && (active === first || active === dialog)) {
            e.preventDefault();
            last.focus();
        }
    };

    const content = (
    <div className="fixed inset-0 z-[150] isolate pointer-events-none flex flex-col bg-nature-50 animate-in fade-in duration-200 h-full w-full lg:items-center lg:justify-center lg:bg-nature-900/40 lg:backdrop-blur-sm">
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
            aria-label={dialogLabel || title}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className="pointer-events-auto flex flex-col h-full w-full lg:max-w-xl lg:h-[90vh] lg:rounded-[3rem] lg:shadow-elegant lg:overflow-hidden lg:bg-nature-50 relative"
        >
            <header className={`flex-none flex items-center justify-between px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 z-20 transition-colors ${heroImage ? 'bg-transparent text-white absolute top-0 w-full' : 'bg-white border-b border-nature-100 shadow-sm relative'}`}>
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button aria-label="Voltar" onClick={onBack} className={`p-2.5 rounded-xl active:scale-90 transition-all shadow-sm ${heroImage ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-nature-50 text-nature-600'}`}>
                            <ChevronRight className="rotate-180" size={ICON_SIZE.MD} />
                        </button>
                    )}
                    <div className="space-y-0.5">
                        <h2 id={titleId} className={`text-lg font-serif italic leading-none ${heroImage ? 'text-white drop-shadow-md' : 'text-nature-900'}`}>{title}</h2>
                        <p id={subtitleId} className={`text-[9px] uppercase tracking-[0.3em] font-bold ${heroImage ? 'text-white/80 drop-shadow-sm' : 'text-nature-400'}`}>{subtitle}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {headerRight}
                    {resolvedClose && (
                        <button aria-label="Fechar" onClick={resolvedClose} className={`p-2.5 rounded-xl active:scale-90 transition-all shadow-sm ${heroImage ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-rose-50 text-rose-400'}`}>
                            <X size={ICON_SIZE.MD} />
                        </button>
                    )}
                </div>
            </header>
            
            
            <div className="flex-1 overflow-y-auto pb-[calc(8rem+env(safe-area-inset-bottom))] overscroll-contain relative lg:pb-12 scroll-smooth">
                {heroImage && (
                    <div className="w-full h-72 relative shrink-0">
                        <img 
                            src={heroImage} 
                            crossOrigin="anonymous"
                            onError={(e) => { 
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800';
                            }}
                            className="w-full h-full object-cover" 
                            alt={title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-nature-50/20"></div>
                    </div>
                )}
                <div className={`flex flex-col ${heroImage ? '-mt-12 relative z-10 bg-nature-50 rounded-t-[2.5rem] min-h-[50vh] p-6 shadow-2xl border-t border-white/20' : 'p-6'}`}>
                    {children}
                </div>
            </div>
            
            {footer && <div className="flex-none bg-white border-t border-nature-100 p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] relative z-30 lg:rounded-b-[3rem] lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {footer}
            </div>}
        </div>
    </div>
    );
    if (typeof document === 'undefined' || !document.body) return content;
    return createPortal(content, document.body);
};
