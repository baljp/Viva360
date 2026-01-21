import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });
              
              localStorage.setItem('access_token', data.accessToken);
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed - logout
              localStorage.clear();
              window.location.href = '/';
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data.user;
  }

  async register(userData: any) {
    const { data } = await this.client.post('/auth/register', userData);
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data.user;
  }

  async getCurrentUser() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    localStorage.clear();
  }

  // Users
  async getUserProfile(id: string) {
    const { data } = await this.client.get(`/users/${id}`);
    return data;
  }

  async updateUserProfile(updates: any) {
    const { data } = await this.client.put('/users/profile', updates);
    return data;
  }

  async checkIn() {
    const { data } = await this.client.post('/users/checkin');
    return data;
  }

  // Professionals
  async getProfessionals(filters?: any) {
    const { data } = await this.client.get('/professionals', { params: filters });
    return data;
  }

  async getProfessional(id: string) {
    const { data } = await this.client.get(`/professionals/${id}`);
    return data;
  }

  async getProfessionalPatients() {
    const { data } = await this.client.get('/professionals/me/patients');
    return data;
  }

  async getProfessionalFinance() {
    const { data } = await this.client.get('/professionals/me/finance');
    return data;
  }

  // Appointments
  async createAppointment(appointmentData: any) {
    const { data } = await this.client.post('/appointments', appointmentData);
    return data;
  }

  async getAppointments() {
    const { data } = await this.client.get('/appointments');
    return data;
  }

  async getAppointment(id: string) {
    const { data } = await this.client.get(`/appointments/${id}`);
    return data;
  }

  async updateAppointmentStatus(id: string, status: string, notes?: string) {
    const { data } = await this.client.put(`/appointments/${id}/status`, { status, notes });
    return data;
  }

  async cancelAppointment(id: string) {
    const { data } = await this.client.delete(`/appointments/${id}`);
    return data;
  }

  // Marketplace
  async getProducts(filters?: any) {
    const { data } = await this.client.get('/marketplace', { params: filters });
    return data;
  }

  async getProduct(id: string) {
    const { data} = await this.client.get(`/marketplace/${id}`);
    return data;
  }

  // Notifications
  async getNotifications() {
    const { data } = await this.client.get('/notifications');
    return data;
  }

  async markNotificationAsRead(id: string) {
    const { data } = await this.client.put(`/notifications/${id}/read`);
    return data;
  }

  async markAllNotificationsAsRead() {
    const { data } = await this.client.put('/notifications/read-all');
    return data;
  }

  // Spaces
  async getSpaceRooms() {
    const { data } = await this.client.get('/spaces/rooms');
    return data;
  }

  async getSpaceTeam() {
    const { data } = await this.client.get('/spaces/team');
    return data;
  }

  async getSpaceVacancies() {
    const { data } = await this.client.get('/spaces/my-vacancies');
    return data;
  }

  async getAllVacancies() {
    const { data } = await this.client.get('/spaces/vacancies');
    return data;
  }
}

export const apiClient = new APIClient();
export default apiClient;
