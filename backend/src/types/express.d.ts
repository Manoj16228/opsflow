import { UserRole } from './enums';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      organizationId?: string;
    }
  }
}
