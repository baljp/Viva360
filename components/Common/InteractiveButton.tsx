import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface InteractiveButtonProps extends Omit<HTMLMotionProps<"button">, "whileHover" | "whileTap"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    hapticFeedback?: boolean;
    children: React.ReactNode;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
    variant = 'primary',
    size = 'md',
    hapticFeedback = true,
    className = '',
    onClick,
    children,
    ...rest
}) => {

    const triggerHaptic = () => {
        if (hapticFeedback && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            // Light tap feeling
            window.navigator.vibrate(10);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        triggerHaptic();
        if (onClick) onClick(e);
    };

    const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-widest uppercase transition-all overflow-hidden rounded-2xl outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeStyles = {
        sm: "px-4 py-2 text-[9px]",
        md: "px-6 py-3 text-[10px]",
        lg: "px-8 py-4 text-xs",
    };

    const variantStyles = {
        primary: "bg-nature-900 text-white hover:bg-nature-800 focus:ring-nature-900 shadow-lg hover:shadow-xl",
        secondary: "bg-nature-100 text-nature-900 hover:bg-nature-200 focus:ring-nature-200",
        ghost: "bg-transparent text-nature-700 hover:bg-nature-50 border border-transparent hover:border-nature-100 focus:ring-nature-100",
        glass: "bg-white/20 backdrop-blur-md border border-white/40 text-nature-900 hover:bg-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.05)] focus:ring-white/50",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...rest}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
            {variant === 'primary' && (
                <motion.div
                    className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full"
                    whileHover={{ translateX: "100%" }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                />
            )}
        </motion.button>
    );
};
