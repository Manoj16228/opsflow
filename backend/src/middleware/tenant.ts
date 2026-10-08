import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, TenantMismatchError } from '../utils/errors';

export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.organizationId) {
    return next(new UnauthorizedError('Tenant organization context missing in authenticated claims.'));
  }

  // If a tenant header or query param was optionally passed, ensure it matches the authenticated JWT claims
  const paramOrgId = (req.params.organizationId || req.query.organizationId || req.headers['x-organization-id']) as string | undefined;

  if (paramOrgId && paramOrgId !== req.user.organizationId) {
    return next(new TenantMismatchError('Attempted to access data belonging to another organization.'));
  }

  req.organizationId = req.user.organizationId;
  next();
}
