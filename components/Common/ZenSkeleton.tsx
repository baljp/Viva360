import React from 'react';

export const ZenSkeleton: React.FC<{ className?: string, variant?: 'card' | 'avatar' | 'text' | 'hero' }> = ({ className = "", variant = 'card' }) => {
    const variants = {
        card: `aspect-square rounded-[var(--radius-md)] bg-nature-100`,
        avatar: "w-10 h-10 rounded-full bg-nature-100",
        text: "h-3.5 rounded-lg bg-nature-100 w-full",
        hero: `h-56 rounded-[var(--radius-lg)] bg-nature-100`
    };
    return <div className={`${variants[variant]} animate-pulse ${className}`}></div>;
};

export const OrganicSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-nature-100 animate-pulse rounded-[2rem] ${className}`}></div>
);
