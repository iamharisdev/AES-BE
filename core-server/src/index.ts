import app from '@/app'
import { registerRoutes } from '@/routes'
import { swaggerUI } from '@hono/swagger-ui'
import { createRoute, z } from '@hono/zod-openapi'
import { logger } from 'hono/logger'

registerRoutes()

app.use(logger())

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

const PORT = parseInt(process.env.PORT ?? '3002')

console.log(`app running on http://127.0.0.1:${PORT}`)

export default {
	port: PORT,
	fetch: app.fetch,
}
