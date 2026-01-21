import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight, Leaf, Heart, Users } from 'lucide-react';

interface CarouselProps {
    onComplete: () => void;
}

export const OnboardingCarousel: React.FC<CarouselProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            title: "Bem-vindo ao Viva360",
            subtitle: "Sua jornada de autocuidado começa aqui.",
            desc: "Conectamos você aos melhores terapeutas e espaços de bem-estar para transformar sua saúde física, mental e espiritual.",
            icon: <Leaf size={64} className="text-primary-500" />,
            color: "bg-primary-50",
            image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: 2,
            title: "Conexão Real",
            subtitle: "Encontre o profissional leve para você.",
            desc: "Explore perfis detalhados, leia avaliações e agende sessões com especialistas que ressoam com sua energia.",
            icon: <Users size={64} className="text-amber-500" />,
            color: "bg-amber-50",
            image: "https://images.unsplash.com/photo-1529156069893-b22489024d81?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: 3,
            title: "Evolução Contínua",
            subtitle: "Acompanhe seu progresso.",
            desc: "Registre seu humor, ganhe badges e visualize sua evolução dia após dia no nosso Jardim de Crescimento.",
            icon: <Heart size={64} className="text-red-400" />,
            color: "bg-red-50",
            image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=600"
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        {/* Image Half */}
                        <div className="h-[55%] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10"></div>
                            <img src={slide.image} alt="" className="w-full h-full object-cover animate-in fade-in zoom-in duration-[2s]" />
                        </div>

                        {/* Content Half */}
                        <div className="flex-1 px-8 pt-4 flex flex-col items-center text-center">
                            <div className={`mb-6 p-4 rounded-full ${slide.color} animate-bounce-slow shadow-sm`}>
                                {slide.icon}
                            </div>
                            <h2 className="text-3xl font-light text-nature-800 mb-2">{slide.title}</h2>
                            <p className="text-sm font-bold text-nature-400 uppercase tracking-widest mb-4">{slide.subtitle}</p>
                            <p className="text-nature-600 leading-relaxed max-w-xs mx-auto">{slide.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="p-8 flex justify-between items-center z-20">
                <div className="flex gap-2">
                    {slides.map((_, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-nature-800' : 'w-2 bg-nature-200'}`}></div>
                    ))}
                </div>

                <button
                    onClick={nextSlide}
                    className="w-14 h-14 rounded-full bg-nature-900 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                    {currentSlide === slides.length - 1 ? <ArrowRight size={24} /> : <ChevronRight size={24} />}
                </button>
            </div>
        </div>
    );
};
