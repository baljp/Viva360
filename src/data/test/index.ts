/**
 * TEST DATA INDEX
 *
 * ⚠️  Só importar este módulo em:
 *   - Arquivos *.test.ts / *.spec.ts
 *   - qa/ directory
 *   - Código protegido por `if (import.meta.env.VITE_MOCK_ENABLED)`
 *
 * JAMAIS fazer import direto em views/, components/, src/hooks/, src/flow/
 */
export { TEST_SOUL_CARDS_EXTRA } from './soulCards.test-data';
export { TEST_JOURNEYS_EXTRA } from './journeys.test-data';

// Dados de usuários para demonstração/test
export const TEST_USERS = {
    client: { id: 'client_0', name: 'Buscador Teste', email: 'client0@viva360.com' },
    pro:    { id: 'pro_0',    name: 'Guardião Teste', email: 'pro0@viva360.com' },
    space:  { id: 'hub_0',   name: 'Santuário Teste', email: 'contato.hub0@viva360.com' },
    admin:  { id: 'admin-001', name: 'Admin Viva360',  email: 'admin@viva360.com' },
} as const;

// Santuários de exemplo para fallback visual no SantuarioListView (APENAS dev)
export const TEST_SANTUARIOS = [
    { id: 'demo-s1', name: 'Espaço Gaia [Demo]', address: 'Rua das Flores, 123', city: 'São Paulo, SP', rating: 4.8, guardiansCount: 12, status: 'active' as const, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400', specialties: ['Yoga', 'Meditação'] },
    { id: 'demo-s2', name: 'Centro Luz Interior [Demo]', address: 'Av. da Harmonia, 456', city: 'Florianópolis, SC', rating: 4.9, guardiansCount: 8, status: 'active' as const, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400', specialties: ['Reiki'] },
    { id: 'demo-s3', name: 'Templo Serenidade [Demo]', address: 'Rua do Silêncio, 78', city: 'Curitiba, PR', rating: 4.6, guardiansCount: 5, status: 'invited' as const, image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=400', specialties: ['Acupuntura'] },
];

// Rooms de fallback para SpaceRooms (APENAS dev)
export const TEST_ROOMS = [
    { id: 'demo-room-1', name: 'Sala Cristal [Demo]', capacity: 15, current: 0, status: 'Livre', dailyOccupancy: 42, nextUse: null, image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=600' },
    { id: 'demo-room-2', name: 'Templo Solar [Demo]', capacity: 40, current: 12, status: 'Ocupado', dailyOccupancy: 78, currentEvent: 'Evento Demo', image: 'https://images.unsplash.com/photo-1596131397935-33ec8a7e0892?q=80&w=600' },
    { id: 'demo-room-3', name: 'Domo da Cura [Demo]', capacity: 8, current: 0, status: 'Manutenção', dailyOccupancy: 0, returnDate: 'Demo', image: 'https://images.unsplash.com/photo-1545167622-3a6ac15600f3?q=80&w=600' },
];

// Patients de fallback para SpacePatients (APENAS dev)
export const TEST_PATIENTS = [
    { id: 'demo-p1', name: 'Buscador Demo 1', health: 85, karma: 420, lastVisit: '—', condition: 'Estável', pro: '—' },
    { id: 'demo-p2', name: 'Buscador Demo 2', health: 45, karma: 180, lastVisit: '—', condition: 'Em atenção', pro: '—' },
];
