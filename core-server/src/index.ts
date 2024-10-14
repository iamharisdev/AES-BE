import app from '@/app'
import { env } from '@/env'
import { registerRoutes } from '@/routes'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

registerRoutes()

app.use(logger())
app.use(cors())

// The OpenAPI specification will be available at /docs.json

app.doc('/docs.json', {
	openapi: '3.0.0',
	info: {
		version: '1.0.0',
		title: 'Awaaz Sehat API',
	},
})

app.openAPIRegistry.registerComponent('securitySchemes', 'jwt', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
})

app.get('/docs', swaggerUI({ url: '/docs.json' }))

console.log(`app running on http://127.0.0.1:${env.PORT}`)

export default {
	port: env.PORT,
	fetch: app.fetch,
}
