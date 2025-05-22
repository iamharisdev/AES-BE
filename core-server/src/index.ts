import app from '@/app'
import { env } from '@/env'
import { registerRoutes } from '@/routes'
import { swaggerUI } from '@hono/swagger-ui'
import { serve } from 'bun'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// ✅ Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://awaz-e-sehat.an.r.appspot.com',
  'https://core-server-development-1036152259123.asia-southeast1.run.app',
  'https://aes-admin-1036152259123.us-central1.run.app',
  // add more here as needed
]

// ✅ Apply CORS
app.use('*', cors({
  origin: (origin) => {
    console.log(origin,"OOOOO")
    if (!origin) return ''; // For non-browser requests like curl
    return allowedOrigins.includes(origin) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600,
}))

// ✅ Optional logger
app.use('*', logger())

// ✅ Register all routes
registerRoutes()

// ✅ Swagger setup
app.doc('/docs.json', {
  openapi: '3.0.0',
  info: {
    title: 'Awaaz Sehat API',
    version: '1.0.0',
  },
})

app.openAPIRegistry.registerComponent('securitySchemes', 'jwt', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

app.get('/docs', swaggerUI({ url: '/docs.json' }))

// ✅ Run the server
console.log(`Server running at http://127.0.0.1:${env.PORT}`)

export default {
  port: env.PORT,
  fetch: app.fetch,
}
