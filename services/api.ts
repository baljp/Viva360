import { User, Professional, UserRole, Appointment, Product, Notification, DailyJournalEntry } from '../types';
import { supabase, isMockMode as isSupabaseMock } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeader = () => {
    const token = localStorage.getItem('supabase.auth.token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const request = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...getHeader(), ...options.headers }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || res.statusText || 'API Request Failed');
    }

    return res.json();
};

export const api = {
    auth: {
        loginWithPassword: async (email: string, password: string): Promise<User> => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.session) {
                const user = await api.auth.getCurrentSession();
                if (!user) throw new Error('Session created but user not found.');
                return user;
            }
            throw new Error('Login failed');
        },
        loginWithGoogle: async (role: UserRole = UserRole.CLIENT): Promise<User> => {
            const attemptLogin = async (retries = 3, delay = 1000) => {
                try {
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: window.location.origin,
                            queryParams: {
                                access_type: 'offline',
                                prompt: 'consent',
                            },
                            data: {
                                role: role
                            }
                        }
                    });
                    if (error) throw error;
                    throw new Error('REDIRECTING_TO_GOOGLE');
                } catch (err: any) {
                    if (err.message === 'REDIRECTING_TO_GOOGLE') throw err;
                    
                    if (retries > 0 && (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('DNS'))) {
                        console.warn(`Google login attempt failed. Retrying in ${delay}ms...`, err);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return attemptLogin(retries - 1, delay * 2);
                    }
                    throw err;
                }
            };

            return attemptLogin();
        },
        register: async (data: any): Promise<User> => {
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.name,
                        role: data.role
                    }
                }
            });
            
            if (error) throw error;
            
            const user = await api.auth.getCurrentSession();
            if (!user) {
                return {
                    id: authData.user?.id || 'temp',
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    avatar: '',
                    karma: 0,
                    streak: 0,
                    multiplier: 1,
                    personalBalance: 0,
                    corporateBalance: 0,
                    plantStage: 'seed',
                    plantXp: 0,
                    snaps: []
                };
            }
            return user;
        },
        getCurrentSession: async (): Promise<User | null> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;
            
            return {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Viajante',
                role: (session.user.user_metadata.role as UserRole) || UserRole.CLIENT,
                avatar: session.user.user_metadata.avatar_url || '',
                karma: 0,
                streak: 0,
                multiplier: 1,
                personalBalance: 0,
                corporateBalance: 0,
                plantStage: 'seed',
                plantXp: 0,
                snaps: []
            };
        },
        logout: async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
        }
    },
    users: {
        getById: async (id: string) => {
            try {
                return await request(`/users/${id}`);
            } catch {
                return null;
            }
        },
        update: async (user: User) => {
            try {
                return await request(`/users/${user.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(user)
                });
            } catch {
                return user;
            }
        },
        checkIn: async (uid: string, reward: number = 50) => {
            try {
                return await request('/users/checkin', {
                    method: 'POST',
                    body: JSON.stringify({ userId: uid, reward })
                });
            } catch {
                return { user: null, reward: 0 };
            }
        }
    },
    payment: {
        checkout: async (amount: number, description: string, providerId?: string) => {
            try {
                return await request('/checkout', {
                    method: 'POST',
                    body: JSON.stringify({ amount, description, receiverId: providerId })
                });
            } catch {
                return { success: false };
            }
        }
    },
    professionals: {
        list: async (): Promise<Professional[]> => {
            try {
                return await request('/profiles?role=PROFESSIONAL');
            } catch {
                return [];
            }
        },
        updateNotes: async (pid: string, proId: string, content: string) => {
            try {
                return await request(`/professionals/${proId}/notes`, {
                    method: 'POST',
                    body: JSON.stringify({ patientId: pid, content })
                });
            } catch {
                return true;
            }
        },
        getNotes: async (pid: string, proId: string) => {
            try {
                return await request(`/professionals/${proId}/notes/${pid}`);
            } catch {
                return [];
            }
        },
        grantAccess: async (pid: string) => {
            try {
                return await request(`/professionals/access/${pid}`, { method: 'POST' });
            } catch {
                return true;
            }
        },
        revokeAccess: async () => true,
        getRecordAccessList: async () => [],
        applyToVacancy: async (vid: string) => ({ success: true }),
        getFinanceSummary: async (pid: string) => {
            try {
                return await request(`/professionals/${pid}/finance`);
            } catch {
                return { balance: 0, transactions: [] };
            }
        }
    },
    records: {
        list: async (patientId: string) => {
            try {
                return await request(`/records/${patientId}`);
            } catch {
                return [];
            }
        },
        create: async (record: any) => {
            try {
                return await request('/records', {
                    method: 'POST',
                    body: JSON.stringify(record)
                });
            } catch {
                return record;
            }
        }
    },
    appointments: {
        list: async (uid: string, role: UserRole) => {
            try {
                const all = await request('/appointments');
                if (role === UserRole.PROFESSIONAL) return all.filter((a: Appointment) => a.professionalId === uid);
                return all.filter((a: Appointment) => a.clientId === uid);
            } catch {
                return [];
            }
        },
        create: async (apt: Appointment) => {
            try {
                return await request('/appointments', {
                    method: 'POST',
                    body: JSON.stringify(apt)
                });
            } catch {
                return apt;
            }
        }
    },
    reviews: {
        list: async () => {
            try {
                return await request('/reviews');
            } catch {
                return [];
            }
        },
        create: async (r: any) => {
            try {
                return await request('/reviews', {
                    method: 'POST',
                    body: JSON.stringify(r)
                });
            } catch {
                return r;
            }
        }
    },
    marketplace: {
        listAll: async (): Promise<Product[]> => {
            try {
                return await request('/marketplace');
            } catch {
                return [];
            }
        },
        listByOwner: async (oid: string) => {
            try {
                return await request(`/marketplace?owner=${oid}`);
            } catch {
                return [];
            }
        },
        create: async (p: any) => {
            try {
                return await request('/marketplace', {
                    method: 'POST',
                    body: JSON.stringify(p)
                });
            } catch {
                return { ...p, id: `prod_${Date.now()}` };
            }
        },
        delete: async (id: string) => {
            try {
                await request(`/marketplace/${id}`, { method: 'DELETE' });
                return true;
            } catch {
                return false;
            }
        }
    },
    notifications: {
        list: async (uid?: string) => {
            try {
                return await request('/notifications');
            } catch {
                return [];
            }
        },
        markAsRead: async (id: string) => {
            try {
                await request(`/notifications/${id}/read`, { method: 'POST' });
                return true;
            } catch {
                return true;
            }
        },
        markAllAsRead: async (uid?: string) => {
            try {
                await request('/notifications/read-all', { method: 'POST' });
                return true;
            } catch {
                return true;
            }
        }
    },
    tribe: {
        listPosts: async () => {
            try {
                return await request('/tribe/posts');
            } catch {
                return [];
            }
        },
        createPost: async (content: string, type: 'insight' | 'question' | 'celebration') => {
            try {
                return await request('/tribe/posts', {
                    method: 'POST',
                    body: JSON.stringify({ content, type })
                });
            } catch {
                return { id: `pt_${Date.now()}`, content, type };
            }
        },
        likePost: async (id: string) => {
            try {
                await request(`/tribe/posts/${id}/like`, { method: 'POST' });
                return true;
            } catch {
                return true;
            }
        },
        syncVibration: async (userId: string) => {
            try {
                return await request('/tribe/sync', { method: 'POST' });
            } catch {
                return { success: false };
            }
        }
    },
    spaces: {
        getRooms: async (uid?: string) => {
            try {
                return await request('/spaces/rooms');
            } catch {
                return [];
            }
        },
        getTeam: async (uid?: string) => {
            try {
                return await request('/spaces/team');
            } catch {
                return [];
            }
        },
        getVacancies: async (uid?: string) => {
            try {
                return await request('/spaces/vacancies');
            } catch {
                return [];
            }
        },
        createVacancy: async (v: any) => {
            try {
                return await request('/spaces/vacancies', {
                    method: 'POST',
                    body: JSON.stringify(v)
                });
            } catch {
                return v;
            }
        },
        getTransactions: async (uid?: string) => {
            try {
                return await request('/spaces/transactions');
            } catch {
                return [];
            }
        },
        getProposals: async () => {
            try {
                return await request('/spaces/proposals');
            } catch {
                return [];
            }
        },
        voteProposal: async (id: string, vote: 'for'|'against') => {
            try {
                return await request(`/spaces/proposals/${id}/vote`, {
                    method: 'POST',
                    body: JSON.stringify({ vote })
                });
            } catch {
                return { success: true };
            }
        },
        getEvents: async () => {
            try {
                return await request('/spaces/events');
            } catch {
                return [];
            }
        },
        createEvent: async (evt: any) => {
            try {
                return await request('/spaces/events', {
                    method: 'POST',
                    body: JSON.stringify(evt)
                });
            } catch {
                return { ...evt, id: `evt_${Date.now()}` };
            }
        }
    },
    admin: {
        getDashboard: async () => {
            try {
                return await request('/admin/dashboard');
            } catch {
                return { totalUsers: 0, activeUsers: 0, revenue: 0, systemHealth: { status: 'unknown' } };
            }
        },
        listUsers: async () => {
            try {
                return await request('/admin/users');
            } catch {
                return [];
            }
        },
        blockUser: async () => true,
        getMetrics: async () => {
            try {
                return await request('/admin/metrics');
            } catch {
                return {};
            }
        },
        getMarketplaceOffers: async () => {
            try {
                return await request('/admin/marketplace');
            } catch {
                return [];
            }
        },
        getGlobalFinance: async () => {
            try {
                return await request('/admin/finance');
            } catch {
                return {};
            }
        },
        getLgpdAudit: async () => {
            try {
                return await request('/admin/lgpd');
            } catch {
                return [];
            }
        },
        getSystemHealth: async () => {
            try {
                return await request('/admin/health');
            } catch {
                return {};
            }
        }
    },
    oracle: {
        draw: async (mood: string) => {
            try {
                return await request('/oracle/draw', {
                    method: 'POST',
                    body: JSON.stringify({ mood })
                });
            } catch {
                return { card: null };
            }
        },
        getToday: async () => {
            try {
                return await request('/oracle/today');
            } catch {
                return null;
            }
        },
        history: async () => {
            try {
                return await request('/oracle/history');
            } catch {
                return [];
            }
        }
    },
    links: {
        create: async (targetId: string, type: 'tribo' | 'paciente' | 'escambo' | 'equipe' | 'bazar') => {
            return await request('/links', {
                method: 'POST',
                body: JSON.stringify({ targetId, type })
            });
        },
        accept: async (linkId: string) => {
            return await request(`/links/${linkId}/accept`, { method: 'POST' });
        },
        getMyLinks: async () => {
            try {
                return await request('/links/me');
            } catch {
                return [];
            }
        },
        getPendingRequests: async () => {
            try {
                return await request('/links/pending');
            } catch {
                return [];
            }
        },
        checkLink: async (targetId: string, type?: string) => {
            try {
                const params = type ? `?type=${type}` : '';
                const result = await request(`/links/check/${targetId}${params}`);
                return result.hasLink || false;
            } catch {
                return false;
            }
        },
        reject: async (linkId: string) => {
            return await request(`/links/${linkId}/reject`, { method: 'POST' });
        }
    },
    rituals: {
        save: async (period: string, data: any) => {
            try {
                return await request('/rituals', {
                    method: 'POST',
                    body: JSON.stringify({ period, data })
                });
            } catch {
                return true;
            }
        },
        get: async (period: string) => {
            try {
                return await request(`/rituals/${period}`);
            } catch {
                return [];
            }
        },
        toggle: async (period: string, id: string) => {
            try {
                return await request(`/rituals/${period}/${id}/toggle`, { method: 'POST' });
            } catch {
                return [];
            }
        }
    },
    metamorphosis: {
        checkIn: async (mood: string, hash: string, thumb: string) => {
            try {
                return await request('/metamorphosis/checkin', {
                    method: 'POST',
                    body: JSON.stringify({ mood, hash, thumb })
                });
            } catch {
                return { id: Date.now(), mood, photoThumb: thumb };
            }
        },
        getEvolution: async () => {
            try {
                return await request('/metamorphosis/evolution');
            } catch {
                return { entries: [] };
            }
        }
    },
    journal: {
        create: async (entry: Omit<DailyJournalEntry, 'id' | 'createdAt' | 'userId'>) => {
            try {
                return await request('/journal', {
                    method: 'POST',
                    body: JSON.stringify(entry)
                });
            } catch {
                return { ...entry, id: `jnl_${Date.now()}`, createdAt: new Date().toISOString() };
            }
        },
        list: async () => {
            try {
                return await request('/journal');
            } catch {
                return [];
            }
        },
        getStats: async () => {
            try {
                return await request('/journal/stats');
            } catch {
                return { totalEntries: 0, streak: 0, commonWords: [] };
            }
        }
    },
    presence: {
        goOnline: async () => {
            try {
                return await request('/presence/online', { method: 'POST' });
            } catch {
                return { status: 'ONLINE' };
            }
        },
        goOffline: async () => {
            try {
                return await request('/presence/offline', { method: 'POST' });
            } catch {
                return { status: 'OFFLINE' };
            }
        },
        ping: async () => {
            try {
                return await request('/presence/ping', { method: 'POST' });
            } catch {
                return { status: 'ONLINE' };
            }
        },
        listActive: async () => {
            try {
                const result = await request('/presence');
                return result.online || [];
            } catch {
                return [];
            }
        },
        getStatus: async (guardianId: string) => {
            try {
                const result = await request(`/presence/${guardianId}`);
                return result.status || 'OFFLINE';
            } catch {
                return 'OFFLINE';
            }
        },
        getBatch: async (guardianIds: string[]) => {
            try {
                return await request('/presence/batch', {
                    method: 'POST',
                    body: JSON.stringify({ guardianIds })
                });
            } catch {
                const result: Record<string, string> = {};
                guardianIds.forEach(id => { result[id] = 'OFFLINE'; });
                return result;
            }
        }
    },
    clinical: {
        saveIntervention: async (data: any) => {
            try {
                return await request('/clinical/interventions', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            } catch {
                return { ...data, id: Date.now() };
            }
        },
        listInterventions: async () => {
            try {
                return await request('/clinical/interventions');
            } catch {
                return [];
            }
        }
    },
    audit: {
        listLogs: async () => {
            try {
                return await request('/audit/logs');
            } catch {
                return [];
            }
        }
    },
    chat: {
        listRooms: async () => {
            try {
                return await request('/chat/rooms');
            } catch {
                return [];
            }
        },
        getMessages: async (roomId: string) => {
            try {
                return await request(`/chat/rooms/${roomId}/messages`);
            } catch {
                return [];
            }
        },
        sendMessage: async (roomId: string, content: string) => {
            try {
                await request(`/chat/rooms/${roomId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify({ content })
                });
                return true;
            } catch {
                return false;
            }
        }
    }
};
