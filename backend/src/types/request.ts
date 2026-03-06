import type { Request } from 'express';
import type { AuthUser } from '../middleware/auth.middleware';

export type AuthenticatedRequest<TUser extends object = AuthUser> = Request & {
  user?: TUser;
  requestId?: string;
};
