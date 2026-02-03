import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const VerifiedBadge: React.FC<{ label: string, className?: string }> = ({ label, className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 ${className}`}>
    <ShieldCheck size={12} />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </div>
);
