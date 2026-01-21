
import { User, Professional, UserRole, Appointment, Product, Notification, SpaceRoom, Vacancy, Transaction } from '../types';

const API_URL = 'http://localhost:3000/api';

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
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const dataRes = await handleResponse(res);
            localStorage.setItem('access_token', dataRes.accessToken);
            return { user: dataRes.user, token: dataRes.accessToken };
        },
        me: async (): Promise<User> => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        loginByEmail: async (email: string): Promise<User> => {
            // Deprecated mock method, kept for compatibility if needed, but redirecting to new auth flow if possible
            // For now mapping to a dev login for testing ease if password not provided
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: 'senha123' }) // Default dev password
            });
            const data = await handleResponse(res);
            localStorage.setItem('access_token', data.accessToken);
            return data.user;
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
            const res = await fetch(`${API_URL}/professionals`, { headers: getHeaders() });
            return handleResponse(res);
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
            const res = await fetch(`${API_URL}/appointments`, { headers: getHeaders() });
            return handleResponse(res);
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
            const res = await fetch(`${API_URL}/marketplace/products`, { headers: getHeaders() });
            return handleResponse(res);
        }
    },
    spaces: {
        getRooms: async (sid: string): Promise<SpaceRoom[]> => {
            const res = await fetch(`${API_URL}/spaces/rooms`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getTeam: async (sid: string) => {
            const res = await fetch(`${API_URL}/spaces/team`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getVacancies: async () => {
            const res = await fetch(`${API_URL}/spaces/vacancies`, { headers: getHeaders() });
            return handleResponse(res);
        },
        getTransactions: async (uid: string) => {
            const res = await fetch(`${API_URL}/professionals/finance/transactions`, { headers: getHeaders() });
            return handleResponse(res);
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
    notifications: {
        list: async (userId: string): Promise<Notification[]> => {
            const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
            return handleResponse(res);
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
    }
};
