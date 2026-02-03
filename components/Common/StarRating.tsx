import React from 'react';
import { Star } from 'lucide-react';
import { ICON_SIZE } from './constants';

export const StarRating: React.FC<{ rating: number, onRate?: (r: number) => void, size?: number, interactive?: boolean }> = ({ rating, onRate, size = 16, interactive = false }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star} 
                    onClick={() => interactive && onRate && onRate(star)}
                    className={`${interactive ? 'w-10 h-10 flex items-center justify-center cursor-pointer active:scale-110 transition-transform' : 'cursor-default'}`}
                    disabled={!interactive}
                >
                    <Star 
                        size={interactive ? ICON_SIZE.LG : size} 
                        className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-nature-200 fill-nature-100'}`} 
                    />
                </button>
            ))}
        </div>
    );
};
