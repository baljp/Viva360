
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
        login: async (email: string, password: string): Promise<{ user: User, token: string }> => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await handleResponse(res);
            localStorage.setItem('access_token', data.accessToken);
            return { user: data.user, token: data.accessToken };
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
             // Mock temporary - backend pending full CRUD for rooms
            return [
                { id: 'r1', name: 'Altar do Sol', status: Math.random() > 0.5 ? 'available' : 'occupied' },
                { id: 'r2', name: 'Sala de Cristal', status: Math.random() > 0.3 ? 'occupied' : 'available', currentOccupant: 'Dr. Klaus' }
            ];
        },
        getTeam: async (sid: string) => {
             // Mock temporary
            return [];
        },
        getVacancies: async () => {
            // Mock temporary
            return [];
        },
        getTransactions: async (uid: string) => {
             // Mock temporary
            return [
                { id: '1', userId: uid, type: 'income', amount: 150.00, description: 'Sessão Reiki', date: new Date().toISOString(), status: 'completed' },
                { id: '2', userId: uid, type: 'expense', amount: 50.00, description: 'Aluguel Sala', date: new Date().toISOString(), status: 'completed' }
            ];
        }
    },
};
