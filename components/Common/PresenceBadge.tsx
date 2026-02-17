import React from 'react';

export type PresenceBadgeStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export const PresenceBadge: React.FC<{
  status: PresenceBadgeStatus;
  className?: string;
}> = ({ status, className }) => {
  const normalized = status || 'UNKNOWN';
  const isOnline = normalized === 'ONLINE';
  const label = normalized === 'UNKNOWN' ? 'Status' : isOnline ? 'Online agora' : 'Offline';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest select-none',
        isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-nature-50 text-nature-500 border-nature-100',
        className || '',
      ].join(' ')}
      aria-label={label}
      title={label}
    >
      <span className={['w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-nature-300'].join(' ')} />
      {label}
    </span>
  );
};

