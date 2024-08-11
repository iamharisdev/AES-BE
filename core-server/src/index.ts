import { logger } from 'hono/logger'
import { swaggerUI } from '@hono/swagger-ui'
import { z, createRoute } from '@hono/zod-openapi'
import app from '@/app'
import { registerRoutes } from '@/routes'

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

app.get('/docs', swaggerUI({ url: '/docs.json' }))

const PORT = parseInt(process.env.PORT ?? '3002')

console.log(`app running on http://127.0.0.1:${PORT}`)

export default {
    port: PORT,
    fetch: app.fetch,
}
