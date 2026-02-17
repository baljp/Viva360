import { faker } from '@faker-js/faker';
import { logger } from '../lib/logger';

export interface MockUser {
    id: string;
    name: string;
    email: string;
    role: 'CLIENT' | 'PROFESSIONAL' | 'SPACE' | 'ADMIN';
    avatarUrl: string;
}

export interface MockProfile {
    userId: string;
    bio: string;
    specialties: string[];
    rating: number;
    location: string;
}

class MockDataService {
    private seekers: MockUser[] = [];
    private guardians: (MockUser & { profile: MockProfile })[] = [];
    private sanctuaries: (MockUser & { profile: MockProfile })[] = [];
    private admins: MockUser[] = [];

    constructor() {
        this.generateDataset();
    }

    private generateDataset() {
        logger.info('mockdata.generating');

        // Reset
        this.seekers = [];
        this.guardians = [];
        this.sanctuaries = [];
        
        // 1. Admit
        this.admins.push({
            id: 'admin-001',
            name: 'Admin Viva360',
            email: 'admin@viva360.com',
            role: 'ADMIN',
            avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
        });

        // 2. 50 Seekers (Buscadores)
        for (let i = 0; i < 50; i++) {
            this.seekers.push({
                id: `seeker-${i}`,
                name: `Buscador ${i}`, // Optimization: avoid faker full name for 4k call loop
                email: `seeker${i}@demo.viva360.com`,
                role: 'CLIENT',
                avatarUrl: `https://i.pravatar.cc/150?u=seeker${i}` // Optimization: static predictable URL
            });
        }

        // 3. 20 Guardians (Guardiões)
        const specialtiesList = ['Yoga', 'Reiki', 'Psicologia', 'Massoterapia', 'Acupuntura', 'Meditação'];
        for (let i = 0; i < 20; i++) {
            this.guardians.push({
                id: `guardian-${i}`,
                name: `Guardião ${i}`,
                email: `guardian${i}@demo.viva360.com`,
                role: 'PROFESSIONAL',
                avatarUrl: `https://i.pravatar.cc/150?u=guardian${i}`,
                profile: {
                    userId: `guardian-${i}`,
                    bio: 'Bio otimizada para carga.',
                    specialties: ['Reiki', 'Yoga'],
                    rating: 4.8,
                    location: 'São Paulo'
                }
            });
        }

        // 4. 10 Sanctuaries (Santuários)
        for (let i = 0; i < 10; i++) {
            this.sanctuaries.push({
                id: `space-${i}`,
                name: `Santuário ${i}`,
                email: `space${i}@demo.viva360.com`,
                role: 'SPACE',
                avatarUrl: `https://i.pravatar.cc/150?u=space${i}`,
                profile: {
                    userId: `space-${i}`,
                    bio: 'Espaço Enterprise.',
                    specialties: ['Retiros'],
                    rating: 5.0,
                    location: 'Brasil'
                }
            });
        }
        
        logger.info('mockdata.ready', { seekers: this.seekers.length, guardians: this.guardians.length, sanctuaries: this.sanctuaries.length });
    }

    public getSeekers() { return this.seekers; }
    public getGuardians() { return this.guardians; }
    public getSanctuaries() { return this.sanctuaries; }
    public getAdmin() { return this.admins[0]; }
    
    public findUserByEmail(email: string) {
        // Optimized Lookup: O(N) is bad for 5000 users if called frequently.
        // But for mock login script (sequential), it's acceptable.
        // Also we know the format, we could assume existence, but sticking to array find for safety.
        return  this.admins.find(u => u.email === email) ||
                this.seekers.find(u => u.email === email) ||
                this.guardians.find(u => u.email === email) ||
                this.sanctuaries.find(u => u.email === email);
    }
}

export const mockData = new MockDataService();
