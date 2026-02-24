import type { User } from '../../types';
import { UserRole } from '../../types';
import { request } from './core';
import type { RequestOptions } from './requestClient';

export type AuthRegisterInput = {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
};

export type AuthApi = {
  loginWithPassword: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (role?: UserRole, expectedEmail?: string) => Promise<User>;
  registerWithGoogle: (role?: UserRole, expectedEmail?: string) => Promise<User>;
  register: (data: AuthRegisterInput) => Promise<User>;
  getCurrentSession: () => Promise<User | null>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<unknown>;
  listRoles: () => Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }>;
  selectRole: (role: UserRole) => Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }>;
  addRole: (role: UserRole) => Promise<{ userId: string; roles: UserRole[]; activeRole: UserRole }>;
};

let authImplPromise: Promise<AuthApi> | null = null;
const getAuthImpl = () => {
  if (!authImplPromise) {
    authImplPromise = import('./auth').then((m) => m.createAuthApi(request as <T = unknown>(path: string, opts?: RequestOptions) => Promise<T>));
  }
  return authImplPromise;
};

export const authApi: AuthApi = {
  loginWithPassword: async (email, password) => (await getAuthImpl()).loginWithPassword(email, password),
  loginWithGoogle: async (role, expectedEmail) => (await getAuthImpl()).loginWithGoogle(role, expectedEmail),
  registerWithGoogle: async (role, expectedEmail) => (await getAuthImpl()).registerWithGoogle(role, expectedEmail),
  register: async (data) => (await getAuthImpl()).register(data),
  getCurrentSession: async () => (await getAuthImpl()).getCurrentSession(),
  logout: async () => (await getAuthImpl()).logout(),
  deleteAccount: async () => (await getAuthImpl()).deleteAccount(),
  listRoles: async () => (await getAuthImpl()).listRoles(),
  selectRole: async (role) => (await getAuthImpl()).selectRole(role),
  addRole: async (role) => (await getAuthImpl()).addRole(role),
};
