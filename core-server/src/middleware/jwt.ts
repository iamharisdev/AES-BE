import { env } from '@/env'
import { jwt } from 'hono/jwt'
import { z } from 'zod'
import { UserRole } from '@/models/user'

export const jwtMiddleware = jwt({ secret: env.JWT_SECRET, alg: 'HS256' })

export const jwtPayloadSchema = z.object({
  id: z.string(),
  phoneNumber: z.string(),
  name: z.string(),
  role: z.nativeEnum(UserRole)
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>
