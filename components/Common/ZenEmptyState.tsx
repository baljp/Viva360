import React from 'react';
import { ICON_SIZE } from './constants';

export const ZenEmptyState: React.FC<{ title: string, message: string, icon: any }> = ({ title, message, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-nature-100 flex items-center justify-center text-nature-200">
            <Icon size={ICON_SIZE.MD} />
        </div>
        <div className="space-y-1">
            <h4 className="font-serif italic text-lg text-nature-900">{title}</h4>
            <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest max-w-[200px] leading-relaxed">{message}</p>
        </div>
    </div>
);
