import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction, RecordAccess, Review } from '../types';

const API_URL = 'http://localhost:3000/api';

const getHeader = () => {
    const token = localStorage.getItem('supabase.auth.token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { ...getHeader(), ...options.headers }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || res.statusText || 'API Request Failed');
        }

        return res.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
};

export const api = {
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
            const data = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            // Store token
            if (data.session?.access_token) {
                localStorage.setItem('supabase.auth.token', data.session.access_token);
            }
            
            return data.user as User;
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
            // Mock OAuth for now - backend doesn't support Google yet
             const data = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: `google_${Date.now()}@example.com`, password: 'mock-google-pass' })
            });
             if (data.session?.access_token) {
                localStorage.setItem('supabase.auth.token', data.session.access_token);
            }
            return { ...data.user, id: `google_${Date.now()}` } as User;
        },
        register: async (data: any): Promise<User> => {
            const res = await request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            let user = res.user || res;
            // Flatten Supabase-style metadata if present
            if (user.user_metadata) {
                user = { ...user, ...user.user_metadata };
                delete user.user_metadata;
            }

            if (!res.session?.access_token) {
                try {
                    const loginRes = await request('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ email: data.email, password: data.password })
                    });
                    if (loginRes.session?.access_token) {
                        localStorage.setItem('supabase.auth.token', loginRes.session.access_token);
                    }
                    return loginRes.user;
                } catch (e) {
                    console.error("Auto-login after register failed", e);
                }
            } else {
                localStorage.setItem('supabase.auth.token', res.session.access_token);
            }
            
            return user as User;
        },
        getCurrentSession: async (): Promise<User | null> => {
            try {
                const token = localStorage.getItem('supabase.auth.token');
                if (!token) return null;
                return await request('/profiles/me');
            } catch {
                return null;
            }
        },
        logout: async () => {
            localStorage.removeItem('supabase.auth.token');
        }
    },
    users: {
        getById: async (id: string) => {
             // For now, if it's 'me', call profile. Otherwise mock or impelment general user fetch
             if (id === 'me') return request('/profiles/me');
             // TODO: implement public profile fetch in backend
             return null; 
        },
        update: async (user: User) => request('/profiles/me', { method: 'PATCH', body: JSON.stringify(user) }),
        checkIn: async (uid: string) => {
            const today = new Date().toISOString().split('T')[0];
            try {
                const current = await request('/profiles/me');
                const updatedUser = { 
                    ...current, 
                    karma: (current.karma || 0) + 50,
                    lastCheckIn: today 
                };
                // Pre-emptively update local storage or just return for state update
                return { 
                    user: updatedUser, 
                    reward: 50 
                };
            } catch (e) {
                return { 
                    user: { id: uid, karma: 100, role: 'CLIENT', lastCheckIn: today }, 
                    reward: 50 
                }; 
            }
        }
    },
    payment: {
        checkout: async (amount: number, description: string, providerId?: string) => {
            return request('/marketplace/purchase', {
                method: 'POST',
                body: JSON.stringify({ product_id: 'checkout_generic', amount, description })
            });
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => {
             // TODO: Backend endpoint for listing pros
             return [];
        },
        updateNotes: async (patientId: string, proId: string, content: string) => true,
        getNotes: async (patientId: string, proId: string) => "",
        grantAccess: async () => ({ id: 'mock', status: 'active' } as any),
        revokeAccess: async () => true,
        getRecordAccessList: async () => [],
        applyToVacancy: async (vacancyId: string, proId: string) => true,
        getFinanceSummary: async (proId: string) => ({ transactions: [] })
    },
    appointments: {
        list: async (uid: string, role: UserRole) => request('/appointments'),
        create: async (apt: Appointment) => request('/appointments', { method: 'POST', body: JSON.stringify(apt) })
    },
    reviews: {
        list: async (targetId: string): Promise<Review[]> => [],
        create: async (review: any) => ({ ...review, id: 'mock' })
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => request('/marketplace/products'),
        listByOwner: async (ownerId: string): Promise<Product[]> => [],
        create: async (product: any) => ({ ...product, id: 'mock' }),
        delete: async (id: string) => true
    },
    spaces: {
        getRooms: async (sid: string): Promise<SpaceRoom[]> => [],
        getTeam: async (sid: string) => [],
        getVacancies: async () => [],
        createVacancy: async (vacancy: any) => ({ ...vacancy, id: 'mock' }),
        getTransactions: async (uid: string) => []
    },
    notifications: {
        list: async (uid: string) => request('/notifications'),
        markAsRead: async (uid: string, nid: string) => request(`/notifications/${nid}/read`, { method: 'PATCH' }),
        markAllAsRead: async (uid: string) => true
    }
};
