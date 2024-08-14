import { type ExampleRoute } from '@/routes/example'
import { type HomeRoute } from '@/routes/home-page'
import { expect, test } from 'bun:test'
import { hc } from 'hono/client'

// Constructing a Type Safe Hono Client
const client = hc<HomeRoute & ExampleRoute>('http://127.0.0.1:3000')

test('Health Check', async () => {
	const res = await client.index.$get()
	expect(res.status).toEqual(200)
})
