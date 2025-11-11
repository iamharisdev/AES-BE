import { MiddlewareHandler } from 'hono';
import { UserRole } from '@/models/user';

export const requireSuperAdmin: MiddlewareHandler = async (c, next) => {
  const { role } = c.get('jwtPayload');
  if (role !== UserRole.SuperAdmin) {
    return c.json({ error: 'Forbidden: SuperAdmin access required' }, 403);
  }
  await next();
};

export const requireHealthWorker: MiddlewareHandler = async (c, next) => {
  const { role } = c.get('jwtPayload');
  if (role !== UserRole.HealthWorker) {
    return c.json({ error: 'Forbidden: HealthWorker access required' }, 403);
  }
  await next();
};
