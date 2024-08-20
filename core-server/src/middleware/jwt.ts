import { env } from '@/env'
import { jwt } from 'hono/jwt'
import { z } from 'zod'

export const jwtMiddleware = jwt({ secret: env.JWT_SECRET, alg: 'HS256' })

export const jwtPayloadSchema = z.object({
	phoneNumber: z.string(),
	name: z.string(),
	userType: z.enum(['doctor', 'patient']),
})

export type JwtPayload = z.infer<typeof jwtPayloadSchema>
