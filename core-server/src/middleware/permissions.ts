import { Context } from 'hono'
import { UserRole } from '@/models/user'
import { JwtPayload } from '@/middleware/jwt'

type RoleCheck = {
  roles: UserRole[]
  message?: string
}

export const requireRole = (roleCheck: RoleCheck) => {
  return async (c: Context, next: () => Promise<void>) => {
    const jwtPayload = c.get('jwtPayload') as JwtPayload

    // Check if user's role is in the allowed roles list
    if (!roleCheck.roles.includes(jwtPayload.role)) {
      return c.json(
        {
          error: roleCheck.message || 'You do not have permission to access this resource'
        },
        403
      )
    }

    await next()
  }
}

// Helper functions for common role checks
export const requireDoctor = () => requireRole({ roles: [UserRole.Doctor] })
export const requireAdmin = () => requireRole({ roles: [UserRole.Admin, UserRole.SuperAdmin] })
export const requireSuperAdmin = () => requireRole({ roles: [UserRole.SuperAdmin] })
export const requireHealthWorker = () => requireRole({ roles: [UserRole.HealthWorker] })
