import { faker } from '@faker-js/faker';

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
        console.log('🌱 Generating Enterprise Demo Dataset...');
        
        // 1. Admit (Fixed)
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
                name: faker.person.fullName(),
                email: `seeker${i}@demo.viva360.com`,
                role: 'CLIENT',
                avatarUrl: faker.image.avatar()
            });
        }

        // 3. 20 Guardians (Guardiões)
        const specialtiesList = ['Yoga', 'Reiki', 'Psicologia', 'Massoterapia', 'Acupuntura', 'Meditação'];
        for (let i = 0; i < 20; i++) {
            this.guardians.push({
                id: `guardian-${i}`,
                name: faker.person.fullName(),
                email: `guardian${i}@demo.viva360.com`,
                role: 'PROFESSIONAL',
                avatarUrl: faker.image.avatar(),
                profile: {
                    userId: `guardian-${i}`,
                    bio: faker.lorem.paragraph(),
                    specialties: faker.helpers.arrayElements(specialtiesList, 2),
                    rating: faker.number.float({ min: 4.5, max: 5.0, fractionDigits: 1 }),
                    location: faker.location.city()
                }
            });
        }

        // 4. 5 Sanctuaries (Santuários)
        const sanctuaryNames = ['Templo da Luz', 'Espaço Zen', 'Casa do Ser', 'Oásis Urbano', 'Vila Holística'];
        for (let i = 0; i < 5; i++) {
            this.sanctuaries.push({
                id: `space-${i}`,
                name: sanctuaryNames[i],
                email: `contact@${sanctuaryNames[i].toLowerCase().replace(/ /g, '')}.com`,
                role: 'SPACE',
                avatarUrl: 'https://images.unsplash.com/photo-1545205597-876fba9911f6?auto=format&fit=crop&q=80&w=200',
                profile: {
                    userId: `space-${i}`,
                    bio: 'Um espaço dedicado à cura e expansão da consciência.',
                    specialties: ['Retiros', 'Workshops', 'Locação'],
                    rating: 5.0,
                    location: 'São Paulo, SP'
                }
            });
        }
        
        console.log(`✅ Dataset Ready: ${this.seekers.length} Seekers, ${this.guardians.length} Guardians, ${this.sanctuaries.length} Sanctuaries.`);
    }

    public getSeekers() { return this.seekers; }
    public getGuardians() { return this.guardians; }
    public getSanctuaries() { return this.sanctuaries; }
    public getAdmin() { return this.admins[0]; }
    
    public findUserByEmail(email: string) {
        return  this.admins.find(u => u.email === email) ||
                this.seekers.find(u => u.email === email) ||
                this.guardians.find(u => u.email === email) ||
                this.sanctuaries.find(u => u.email === email);
    }
}

export const mockData = new MockDataService();
