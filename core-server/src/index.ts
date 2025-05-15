import app from '@/app'
import { env } from '@/env'
import { registerRoutes } from '@/routes'
import { swaggerUI } from '@hono/swagger-ui'
import { serve } from 'bun'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'



app.use(cors({
  origin: 'https://awaz-e-sehat.an.r.appspot.com', // ✅ Only allow your frontend
  allowHeaders: ['Content-Type', 'Authorization'], // ✅ Allow auth headers
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅ All HTTP verbs
  maxAge: 600, // Optional: cache preflight for 10 mins
}));

registerRoutes()

app.use(logger())

// app.use(cors({ origin: "https://core-server-development-1036152259123.asia-southeast1.run.app" }));

// app.use(cors({
//   origin: '*',
//   allowHeaders: ['Content-Type', 'Authorization'],
//   allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// }));

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

