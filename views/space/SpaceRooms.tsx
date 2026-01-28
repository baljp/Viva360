import React, { useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../components/Common';
import { Plus, Edit3, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const SpaceRooms: React.FC = () => {
    const { go } = useSantuarioFlow();
    
    // Mock Data with multiple images for carousel
    const rooms = [
        { id: 1, name: 'Sala Cristal', capacity: 15, current: 0, status: 'Livre', images: [
            'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=600',
            'https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=600'
        ]},
        { id: 2, name: 'Templo Solar', capacity: 40, current: 12, status: 'Ocupado', images: [
            'https://images.unsplash.com/photo-1596131397935-33ec8a7e0892?q=80&w=600'
        ]},
        { id: 3, name: 'Domo da Cura', capacity: 8, current: 0, status: 'Manutenção', images: [
             'https://images.unsplash.com/photo-1545167622-3a6ac15600f3?q=80&w=600',
             'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=600'
        ]}
    ];

    const [activeImages, setActiveImages] = useState<Record<number, number>>({});

    const nextImage = (e: React.MouseEvent, roomId: number, max: number) => {
        e.stopPropagation();
        setActiveImages(prev => ({...prev, [roomId]: ((prev[roomId] || 0) + 1) % max}));
    };

    return (
        <PortalView title="Mundo Físico" subtitle="SEUS ALTARES" onBack={() => go('DASHBOARD')} heroImage="https://images.unsplash.com/photo-1560183286-68199927b202?q=80&w=800">
            <div className="space-y-6 px-2">
                <div className="bg-nature-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-nature-700 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50"></div>
                    <h3 className="text-3xl font-serif italic relative z-10">Altares Sagrados</h3>
                    <p className="text-nature-200 text-xs mt-2 relative z-10 max-w-xs">Gerencie a energia e ocupação dos seus espaços de cura.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 pb-24">
                    {rooms.map(room => (
                        <div key={room.id} className="bg-white rounded-[2.5rem] border border-nature-100 shadow-lg overflow-hidden relative group">
                            {/* Image Carousel */}
                            <div className="h-48 w-full relative bg-nature-100">
                                <img 
                                    src={room.images[activeImages[room.id] || 0]} 
                                    className="w-full h-full object-cover transition-all duration-500"
                                />
                                {room.images.length > 1 && (
                                    <button 
                                        onClick={(e) => nextImage(e, room.id, room.images.length)}
                                        className="absolute right-4 bottom-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                )}
                                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase text-nature-900 shadow-sm">
                                    {room.status}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-serif italic text-nature-900">{room.name}</h4>
                                        <p className="text-[10px] uppercase font-bold text-nature-400 tracking-widest mt-1">Capacidade: {room.capacity} Almas</p>
                                    </div>
                                    <div className="w-10 h-10 bg-nature-50 rounded-full flex items-center justify-center text-nature-400 hover:bg-nature-900 hover:text-white transition-colors cursor-pointer">
                                        <Edit3 size={16}/>
                                    </div>
                                </div>
                                <div className="w-full bg-nature-50 h-2 rounded-full overflow-hidden">
                                     <div className="bg-nature-900 h-full transition-all duration-1000" style={{ width: `${(room.current/room.capacity)*100}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] font-bold text-nature-400 uppercase">
                                    <span>Ocupação</span>
                                    <span>{Math.round((room.current/room.capacity)*100)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={() => go('SANTUARIO_LIST')} className="w-full py-6 border-2 border-dashed border-nature-200 rounded-[2.5rem] text-nature-400 font-bold uppercase tracking-widest hover:border-nature-400 hover:text-nature-600 transition-all flex items-center justify-center gap-2">
                        <Plus size={20} /> Novo Altar
                    </button>
                </div>
            </div>
        </PortalView>
    );
};
