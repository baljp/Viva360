import type { CartItem, User } from '../../types';
import { UserRole } from '../../types';

const normalizeRoleValue = (value: unknown) =>
  typeof value === 'string' ? value.toUpperCase() : value;

const normalizeAppRole = (value: unknown): UserRole =>
  (String(normalizeRoleValue(value) || '').toUpperCase() in UserRole
    ? String(normalizeRoleValue(value)).toUpperCase()
    : UserRole.CLIENT) as UserRole;

export const normalizeUserForApp = (input: unknown): User => {
  const user = { ...(input as User) } as User;
  user.role = normalizeAppRole(user.role);
  if (typeof user.activeRole === 'string') {
    user.activeRole = normalizeAppRole(user.activeRole);
    user.role = user.activeRole;
  }
  if (Array.isArray(user.roles)) {
    user.roles = user.roles.map((entry) => normalizeAppRole(entry));
  }
  return user;
};

export const mergeUserForApp = (prev: User | null, incomingRaw: unknown): User => {
  const incoming = normalizeUserForApp(incomingRaw);
  if (!prev) return incoming;

  const sameIdentity =
    String(prev.id || '') === String(incoming.id || '') &&
    String(prev.email || '').toLowerCase() === String(incoming.email || '').toLowerCase();

  if (!sameIdentity) return incoming;
  return normalizeUserForApp({ ...prev, ...incoming });
};

export const loadCartFromStorage = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('viva360.cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const persistCartToStorage = (cart: CartItem[]) => {
  try {
    localStorage.setItem('viva360.cart', JSON.stringify(cart));
  } catch {
    // ignore storage failures
  }
};

export const clearCartStorage = () => {
  try {
    localStorage.removeItem('viva360.cart');
  } catch {
    // ignore storage failures
  }
};

export const readPendingInvite = () => {
  try {
    return {
      token: localStorage.getItem('viva360.pendingInviteToken'),
      destination: localStorage.getItem('viva360.pendingInviteDestination'),
    };
  } catch {
    return { token: null, destination: null };
  }
};

export const clearPendingInvite = () => {
  try {
    localStorage.removeItem('viva360.pendingInviteToken');
    localStorage.removeItem('viva360.pendingInviteDestination');
  } catch {
    // ignore storage failures
  }
};
