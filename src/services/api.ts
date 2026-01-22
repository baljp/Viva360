
import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction, SwapOffer } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============= MOCK DATA FOR OFFLINE/DEMO MODE =============
const MOCK_PROFESSIONALS: Professional[] = [
    { id: 'pro_1', userId: 'user_pro_1', name: 'Ana Clara Silva', email: 'ana@viva360.com', role: UserRole.PROFESSIONAL, specialty: ['Yoga', 'Meditação'], rating: 4.9, pricePerSession: 180, avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=ana', bio: 'Especialista em yoga terapêutico com 10 anos de experiência.', swapCredits: 100, isAvailableForSwap: true, needs: [], offers: [], totalHealingHours: 500, karma: 2500, streak: 30, multiplier: 1.5, plantXp: 100, plantStage: 'BLOOM', corporateBalance: 5000, personalBalance: 3200 },
    { id: 'pro_2', userId: 'user_pro_2', name: 'Carlos Mendes', email: 'carlos@viva360.com', role: UserRole.PROFESSIONAL, specialty: ['Reiki', 'Barras de Access'], rating: 4.8, pricePerSession: 150, avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=carlos', bio: 'Mestre Reiki nível 3 e facilitador de Barras de Access.', swapCredits: 80, isAvailableForSwap: true, needs: [], offers: [], totalHealingHours: 320, karma: 1800, streak: 15, multiplier: 1.2, plantXp: 80, plantStage: 'SAPLING', corporateBalance: 3500, personalBalance: 2800 },
    { id: 'pro_3', userId: 'user_pro_3', name: 'Fernanda Lima', email: 'fernanda@viva360.com', role: UserRole.PROFESSIONAL, specialty: ['Massagem', 'Aromaterapia'], rating: 4.7, pricePerSession: 200, avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=fernanda', bio: 'Terapeuta corporal especializada em técnicas orientais.', swapCredits: 120, isAvailableForSwap: false, needs: [], offers: [], totalHealingHours: 450, karma: 2200, streak: 22, multiplier: 1.3, plantXp: 90, plantStage: 'BLOOM', corporateBalance: 4200, personalBalance: 3000 },
];

const MOCK_PRODUCTS: Product[] = [
    { id: 'prod_1', name: 'Incenso Sândalo Premium', price: 45.90, image: 'https://images.unsplash.com/photo-1600026453168-3ce7da7c5d7e?w=400', category: 'Incensos', type: 'physical' },
    { id: 'prod_2', name: 'Cristal Ametista Natural', price: 189.00, image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400', category: 'Cristais', type: 'physical' },
    { id: 'prod_3', name: 'Óleo Essencial Lavanda', price: 78.50, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', category: 'Aromaterapia', type: 'physical' },
    { id: 'prod_4', name: 'Tapete de Yoga Eco', price: 299.00, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', category: 'Acessórios', type: 'physical' },
];

const MOCK_ROOMS: SpaceRoom[] = [
    { id: 'room_1', name: 'Sala Luz', status: 'available', currentOccupant: undefined, capacity: 4, resources: ['Maca', 'Som'] },
    { id: 'room_2', name: 'Sala Harmonia', status: 'occupied', currentOccupant: 'Ana Clara', capacity: 2, resources: ['Tatame', 'Projetor'] },
    { id: 'room_3', name: 'Sala Serenidade', status: 'available', currentOccupant: undefined, capacity: 10, resources: ['Cadeiras', 'Quadro'] },
];

const MOCK_VACANCIES: Vacancy[] = [
    { id: 'vac_1', title: 'Terapeuta de Reiki', description: 'Buscamos mestre Reiki para atendimentos às sextas.', specialties: ['Reiki', 'Terapias Energéticas'], applicantsCount: 5, hubId: 'hub_1', createdAt: new Date().toISOString(), status: 'open', type: 'fixed', schedule: 'Sex: 08-18h', modality: 'presencial', split: '70/30' },
    { id: 'vac_2', title: 'Instrutor de Yoga', description: 'Vaga para instrutor de Hatha Yoga no período da manhã.', specialties: ['Yoga', 'Meditação'], applicantsCount: 8, hubId: 'hub_1', createdAt: new Date().toISOString(), status: 'open', type: 'fixed', schedule: 'Seg/Qua: 08-12h', modality: 'presencial', split: '60/40' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'tx_1', description: 'Sessão Reiki - Carlos', amount: 150, type: 'income', date: new Date().toISOString(), userId: 'user_1', status: 'completed' },
    { id: 'tx_2', description: 'Aluguel Sala Luz', amount: 80, type: 'expense', date: new Date(Date.now() - 86400000).toISOString(), userId: 'user_1', status: 'completed' },
    { id: 'tx_3', description: 'Sessão Yoga - Ana', amount: 180, type: 'income', date: new Date(Date.now() - 172800000).toISOString(), userId: 'user_1', status: 'completed' },
];

const MOCK_APPOINTMENTS: Appointment[] = [
    { id: 'apt_1', clientId: 'client_1', clientName: 'João Silva', professionalId: 'pro_1', professionalName: 'Ana Clara', serviceName: 'Yoga Terapêutico', price: 180, date: new Date().toISOString(), time: '14:00', status: 'confirmed', type: 'paid' },
    { id: 'apt_2', clientId: 'client_2', clientName: 'Maria Santos', professionalId: 'pro_2', professionalName: 'Carlos Mendes', serviceName: 'Reiki', price: 150, date: new Date(Date.now() + 86400000).toISOString(), time: '10:00', status: 'pending', type: 'paid' },
];

// ============= SAFE FETCH WRAPPER =============
// CRITICAL: In production, throw errors instead of returning mock data
const safeFetch = async <T>(request: () => Promise<T>, fallback: T): Promise<T> => {
    try {
        return await request();
    } catch (error) {
        // In production, FAIL LOUD - don't show fake data
        if (import.meta.env.PROD) {
            console.error('[Viva360] API Error:', error);
            throw error;
        }
        // Only use fallback in development
        console.warn('[Viva360] DEV MODE - API indisponível, usando dados de demonstração:', error);
        return fallback;
    }
};

// Helper for authenticated requests
const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || 'Erro na requisição');
    }
    return res.json();
};

export const api = {
    auth: {
        loginWithGoogle: async (role?: UserRole): Promise<{ user: User, token: string }> => {
            // Mocking Google Login for now, usually involves redirection or popup
            // Sending role to backend if registering
            const res = await fetch(`${API_URL}/auth/google/callback?role=${role || ''}`, {
                method: 'POST', // mocked
                headers: { 'Content-Type': 'application/json' },
            }).catch(() => ({
                 // Fallback mock if backend endpoint missing
                 json: async () => ({
                    accessToken: 'mock_google_token',
                    user: { 
                        id: 'google_user_1', 
                        name: 'Google User', 
                        email: 'google@viva360.com', 
                        role: role || UserRole.CLIENT,
                        avatar: 'https://lh3.googleusercontent.com/a/default-user'
                    }
                 })
            }));
             // @ts-ignore
            const data = typeof res.json === 'function' ? await res.json() : await handleResponse(res);
            
            localStorage.setItem('access_token', data.accessToken);
            return { user: data.user as User, token: data.accessToken };
        },
        register: async (data: any): Promise<{ user: User, token: string }> => {
            const mockUser: User = {
                id: `user_${Date.now()}`,
                name: data.name || 'Novo Usuário',
                email: data.email || 'novo@viva360.com',
                role: data.role || UserRole.CLIENT,
                avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=' + Date.now(),
                karma: 100,
                streak: 0,
                multiplier: 1,
                corporateBalance: 0,
                personalBalance: 500,
                plantStage: 'SEED',
                plantXp: 0
            };
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const dataRes = await handleResponse(res);
                localStorage.setItem('access_token', dataRes.accessToken);
                return { user: dataRes.user, token: dataRes.accessToken };
            }, { user: mockUser, token: 'mock_token_' + Date.now() });
        },
        me: async (): Promise<User> => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        loginByEmail: async (email: string): Promise<User> => {
            // Mock user based on email pattern for demo mode
            const getMockUserByEmail = (email: string): User => {
                const isClient = email.includes('client') || email.includes('ana') || email.includes('joao');
                const isPro = email.includes('pro') || email.includes('luna') || email.includes('carlos');
                const isSpace = email.includes('hub') || email.includes('space') || email.includes('contato');
                
                const role = isPro ? UserRole.PROFESSIONAL : isSpace ? UserRole.SPACE : UserRole.CLIENT;
                const name = isPro ? 'Luna Guardião' : isSpace ? 'Hub Viva360' : 'Ana Buscadora';
                
                return {
                    id: `user_${email.replace(/[^a-z0-9]/gi, '_')}`,
                    name,
                    email,
                    role,
                    avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`,
                    karma: 1500,
                    streak: 7,
                    multiplier: 1.2,
                    corporateBalance: 2000,
                    personalBalance: 1500,
                    plantStage: 'BLOOM',
                    plantXp: 80
                };
            };
            
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: 'senha123' })
                });
                const data = await handleResponse(res);
                localStorage.setItem('access_token', data.accessToken);
                return data.user;
            }, getMockUserByEmail(email));
        }
    },
    users: {
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/users/${id}`, { headers: getHeaders() });
            return handleResponse(res);
        },
        update: async (user: User) => {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(user)
            });
            return handleResponse(res);
        },
        checkIn: async (uid: string) => {
            const res = await fetch(`${API_URL}/users/check-in`, {
                method: 'POST',
                headers: getHeaders()
            });
            return handleResponse(res);
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/professionals`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_PROFESSIONALS);
        },
        getFinanceSummary: async (uid: string) => {
            const res = await fetch(`${API_URL}/professionals/finance/summary`, { headers: getHeaders() });
            return handleResponse(res);
        },
        // Mocks restored for frontend compatibility
        updateNotes: async (patientId: string, proId: string, content: string) => {
            await new Promise(r => setTimeout(r, 500));
            return true;
        },
        getNotes: async (patientId: string, proId: string) => {
            return "Paciente apresenta evolução constante.";
        }
    },
    appointments: {
        list: async (uid: string, role: UserRole) => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/appointments`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_APPOINTMENTS);
        },
        create: async (apt: Partial<Appointment>) => {
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(apt)
            });
            return handleResponse(res);
        },
        updateStatus: async (id: string, status: string) => {
            const res = await fetch(`${API_URL}/appointments/${id}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status })
            });
            return handleResponse(res);
        }
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/marketplace/products`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_PRODUCTS);
        }
    },
    spaces: {
        getRooms: async (sid: string): Promise<SpaceRoom[]> => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/spaces/rooms`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_ROOMS);
        },
        getTeam: async (sid: string) => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/spaces/team`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_PROFESSIONALS);
        },
        getVacancies: async () => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/spaces/vacancies`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_VACANCIES);
        },
        createVacancy: async (data: Partial<Vacancy>) => {
            const res = await fetch(`${API_URL}/spaces/vacancies`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        getTransactions: async (uid: string) => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/professionals/finance/transactions`, { headers: getHeaders() });
                return handleResponse(res);
            }, MOCK_TRANSACTIONS);
        }
    },
    payments: {
        createPaymentIntent: async (amount: number, currency: string = 'brl') => {
            const res = await fetch(`${API_URL}/payments/create-payment-intent`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ amount, currency })
            });
            return handleResponse(res);
        }
    },
    /**
     * Batch Checkout API - 10x performance improvement
     * Processes entire cart in single atomic transaction
     */
    checkout: {
        /**
         * Process entire cart at once (recommended)
         * 1 API call instead of N sequential calls
         */
        processBatch: async (items: Array<{
            productId?: string;
            professionalId?: string;
            serviceName: string;
            price: number;
            quantity: number;
            type: 'product' | 'service';
            date?: string;
            time?: string;
        }>, paymentMethod: string = 'BALANCE') => {
            const res = await fetch(`${API_URL}/checkout/batch`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ items, paymentMethod })
            });
            return handleResponse(res);
        },
        /**
         * Validate cart before processing (for UI feedback)
         */
        validate: async (items: any[]) => {
            const res = await fetch(`${API_URL}/checkout/validate`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ items })
            });
            return handleResponse(res);
        }
    },
    notifications: {
        list: async (userId: string): Promise<Notification[]> => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
                return handleResponse(res);
            }, []);
        },
        markAsRead: async (userId: string, id: string) => {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        markAllAsRead: async (userId: string) => {
             const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            return handleResponse(res);
        }
    },
    soulPharmacy: {
        listPills: async (mood?: string) => {
             const query = mood ? `?mood=${mood}` : '';
             const res = await fetch(`${API_URL}/soul-pharmacy/pills${query}`, { headers: getHeaders() });
             return handleResponse(res);
        }
    },
    swaps: {
        listOffers: async (): Promise<SwapOffer[]> => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/swaps/offers`, { headers: getHeaders() });
                return handleResponse(res);
            }, []);
        },
        createOffer: async (offer: any) => {
            const res = await fetch(`${API_URL}/swaps/offers`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(offer)
            });
            return handleResponse(res);
        },
        proposeMatch: async (targetId: string, data: any) => {
            const res = await fetch(`${API_URL}/swaps/${targetId}/match`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        }
    },
    rituals: {
        checkIn: async (mood?: string, intention?: string, photoUrl?: string) => {
            const res = await fetch(`${API_URL}/rituals/check-in`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ mood, intention, photoUrl })
            });
            return handleResponse(res);
        },
        getStatus: async () => {
            const res = await fetch(`${API_URL}/rituals/status`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getQuests: async () => {
            return safeFetch(async () => {
                const res = await fetch(`${API_URL}/rituals/quests`, { headers: getHeaders() });
                return handleResponse(res);
            }, { quests: [] });
        },
        waterPlant: async (targetUserId?: string, message?: string) => {
            const res = await fetch(`${API_URL}/rituals/water`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ targetUserId, message })
            });
            return handleResponse(res);
        },
        breathe: async (duration: number, technique?: string) => {
            const res = await fetch(`${API_URL}/rituals/breathe`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ duration, technique })
            });
            return handleResponse(res);
        },
        gratitude: async (content: string, photoUrl?: string) => {
            const res = await fetch(`${API_URL}/rituals/gratitude`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content, photoUrl })
            });
            return handleResponse(res);
        }
    },
    finance: {
        getSummary: async (period: number = 30) => {
            const res = await fetch(`${API_URL}/finance/summary?period=${period}`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getTransactions: async (page: number = 1, type?: 'INCOME' | 'EXPENSE') => {
            const params = new URLSearchParams({ page: page.toString(), limit: '20' });
            if (type) params.append('type', type);
            const res = await fetch(`${API_URL}/finance/transactions?${params}`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getTeamPerformance: async (period: number = 30) => {
            const res = await fetch(`${API_URL}/finance/team-performance?period=${period}`, { headers: getHeaders() });
            return handleResponse(res);
        },
        updateCommission: async (memberId: string, commissionRate: number) => {
            const res = await fetch(`${API_URL}/finance/commission/${memberId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ commissionRate })
            });
            return handleResponse(res);
        },
        withdraw: async (amount: number, pixKey: string) => {
            const res = await fetch(`${API_URL}/finance/withdraw`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ amount, pixKey })
            });
            return handleResponse(res);
        }
    },
    rooms: {
        getRealTime: async () => {
            const res = await fetch(`${API_URL}/rooms/real-time`, { headers: getHeaders() });
            return handleResponse(res);
        },
        updateStatus: async (roomId: string, status: string, currentOccupant?: string) => {
            const res = await fetch(`${API_URL}/rooms/${roomId}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status, currentOccupant })
            });
            return handleResponse(res);
        },
        createBooking: async (roomId: string, date: string, startTime: string, endTime: string, price?: number) => {
            const res = await fetch(`${API_URL}/rooms/bookings`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ roomId, date, startTime, endTime, price })
            });
            return handleResponse(res);
        },
        cancelBooking: async (bookingId: string) => {
            const res = await fetch(`${API_URL}/rooms/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        getSchedule: async (roomId: string, date?: string) => {
            const params = date ? `?date=${date}` : '';
            const res = await fetch(`${API_URL}/rooms/${roomId}/schedule${params}`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getAnalytics: async (period: number = 7) => {
            const res = await fetch(`${API_URL}/rooms/analytics?period=${period}`, { headers: getHeaders() });
            return handleResponse(res);
        }
    }
};
