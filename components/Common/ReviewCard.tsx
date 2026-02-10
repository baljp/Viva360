import React from 'react';
import { Review } from '../../types';
import { StarRating } from './StarRating';

export const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="card-functional flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <img 
                    src={review.authorAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${review.authorName}`} 
                    crossOrigin="anonymous"
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${review.authorName}`; }}
                    className="w-10 h-10 rounded-full border border-nature-200 object-cover" 
                />
                <div>
                    <p className="text-xs font-bold text-nature-900">{review.authorName}</p>
                    <p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(review.date).toLocaleDateString()}</p>
                </div>
            </div>
            <StarRating rating={review.rating} size={12} />
        </div>
        <p className="text-xs text-nature-600 italic leading-relaxed">"{review.comment}"</p>
        {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
                {review.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-nature-50 text-nature-500 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-nature-100">
                        {tag}
                    </span>
                ))}
            </div>
        )}
    </div>
);
