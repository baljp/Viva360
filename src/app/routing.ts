import { ViewState } from '../../types';

export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/register/client',
  '/register/pro',
  '/register/space',
  '/reset-password',
];

export const VIEW_PATHS: Partial<Record<ViewState, string>> = {
  [ViewState.LOGIN]: '/login',
  [ViewState.REGISTER]: '/register',
  [ViewState.REGISTER_CLIENT]: '/register/client',
  [ViewState.REGISTER_PRO]: '/register/pro',
  [ViewState.REGISTER_SPACE]: '/register/space',
  [ViewState.CLIENT_HOME]: '/client/home',
  [ViewState.CLIENT_JOURNAL]: '/client/journal',
  [ViewState.CLIENT_JOURNEY]: '/client/journey',
  [ViewState.CLIENT_EXPLORE]: '/client/explore',
  [ViewState.CLIENT_TRIBO]: '/client/tribe',
  [ViewState.CLIENT_ORACLE]: '/client/oracle',
  [ViewState.CLIENT_METAMORPHOSIS]: '/client/metamorphosis',
  [ViewState.CLIENT_TIMELAPSE]: '/client/timelapse',
  [ViewState.CLIENT_ORDERS]: '/client/orders',
  [ViewState.CLIENT_MARKETPLACE]: '/client/marketplace',
  [ViewState.CLIENT_CHECKOUT]: '/checkout',
  [ViewState.CLIENT_CHECKOUT_SUCCESS]: '/checkout/success',
  [ViewState.PRO_HOME]: '/pro/home',
  [ViewState.PRO_PATIENTS]: '/pro/patients',
  [ViewState.PRO_AGENDA]: '/pro/agenda',
  [ViewState.PRO_MARKETPLACE]: '/pro/marketplace',
  [ViewState.PRO_NETWORK]: '/pro/network',
  [ViewState.PRO_FINANCE]: '/pro/finance',
  [ViewState.PRO_OPPORTUNITIES]: '/pro/opportunities',
  [ViewState.SPACE_HOME]: '/space/home',
  [ViewState.SPACE_TEAM]: '/space/team',
  [ViewState.SPACE_RECRUITMENT]: '/space/recruitment',
  [ViewState.SPACE_FINANCE]: '/space/finance',
  [ViewState.SPACE_MARKETPLACE]: '/space/marketplace',
  [ViewState.SPACE_ROOMS]: '/space/rooms',
  [ViewState.SETTINGS]: '/settings',
  [ViewState.SETTINGS_PROFILE]: '/settings/profile',
  [ViewState.SETTINGS_WALLET]: '/settings/wallet',
  [ViewState.SETTINGS_NOTIFICATIONS]: '/settings/notifications',
  [ViewState.SETTINGS_SECURITY]: '/settings/security',
  [ViewState.ADMIN_DASHBOARD]: '/admin/dashboard',
  [ViewState.ADMIN_USERS]: '/admin/users',
  [ViewState.ADMIN_LGPD]: '/admin/lgpd',
};

const HOME_PATH_BY_ROLE: Record<string, string> = {
  CLIENT: '/client/home',
  PROFESSIONAL: '/pro/home',
  SPACE: '/space/home',
  ADMIN: '/admin/dashboard',
};

export const resolveHomePath = (role?: string) =>
  HOME_PATH_BY_ROLE[String(role || '').toUpperCase()] || '/client/home';

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/invite');

export const resolveViewFromPath = (path: string): ViewState => {
  const exactMatch = Object.entries(VIEW_PATHS).find(([, routePath]) => routePath === path);
  if (exactMatch) return exactMatch[0] as ViewState;

  if (path === '/client/garden') return ViewState.CLIENT_JOURNEY;
  if (path.startsWith('/client/')) {
    if (path.includes('oracle')) return ViewState.CLIENT_ORACLE;
    if (path.includes('journey') || path.includes('evolution') || path.includes('garden') || path.includes('time-lapse')) return ViewState.CLIENT_JOURNEY;
    if (path.includes('metamorphosis')) return ViewState.CLIENT_METAMORPHOSIS;
    if (path.includes('tribe') || path.includes('chat') || path.includes('healing')) return ViewState.CLIENT_TRIBO;
    if (path.includes('booking') || path.includes('explore')) return ViewState.CLIENT_EXPLORE;
    if (path.includes('marketplace')) return ViewState.CLIENT_MARKETPLACE;
    if (path.includes('journal')) return ViewState.CLIENT_JOURNAL;
    if (path.includes('orders') || path.includes('payment')) return ViewState.CLIENT_ORDERS;
    return ViewState.CLIENT_HOME;
  }
  if (path.startsWith('/pro/')) {
    if (path.includes('finance')) return ViewState.PRO_FINANCE;
    if (path.includes('opportun') || path.includes('vaga')) return ViewState.PRO_OPPORTUNITIES;
    if (path.includes('patient') || path.includes('agenda')) return path.includes('agenda') ? ViewState.PRO_AGENDA : ViewState.PRO_PATIENTS;
    if (path.includes('market') || path.includes('escambo')) return ViewState.PRO_MARKETPLACE;
    if (path.includes('network') || path.includes('tribe') || path.includes('chat')) return ViewState.PRO_NETWORK;
    return ViewState.PRO_HOME;
  }
  if (path.startsWith('/space/')) {
    if (path.includes('team') || path.includes('pros')) return ViewState.SPACE_TEAM;
    if (path.includes('recruit') || path.includes('vaga')) return ViewState.SPACE_RECRUITMENT;
    if (path.includes('finance')) return ViewState.SPACE_FINANCE;
    if (path.includes('market')) return ViewState.SPACE_MARKETPLACE;
    if (path.includes('room')) return ViewState.SPACE_ROOMS;
    return ViewState.SPACE_HOME;
  }
  if (path.startsWith('/admin/')) {
    if (path.includes('/users')) return ViewState.ADMIN_USERS;
    if (path.includes('/lgpd')) return ViewState.ADMIN_LGPD;
    return ViewState.ADMIN_DASHBOARD;
  }

  return ViewState.SPLASH;
};

