import { env } from '@/env'
import { jwt } from 'hono/jwt'

export const jwtMiddleware = jwt({ secret: env.JWT_SECRET, alg: 'HS256' })
