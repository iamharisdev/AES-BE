import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { RedFlagsSchema } from '@/schemas/red-flags'
import { generateRedFlags } from '@/services/openai'
import { retryOptions } from '@/utils/retryConfig'
import { createRoute, z } from '@hono/zod-openapi'
import { retry } from '@lifeomic/attempt'
import { eq } from 'drizzle-orm'

const RedFlagsGenerationRequestSchema = z.object({
	emrId: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE' }),
	useMini: z.boolean().optional().default(false).openapi({
		description: 'Whether to use smaller GPT model (for testing), defaults to false',
	}),
})

const RedFlagsGenerationResponseSchema = z.object({
	redFlags: RedFlagsSchema,
})

const NotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No patient exists with the given phone number' }),
})

const route = createRoute({
	method: 'post',
	operationId: 'redFlagsGeneration',
	tags: ['Red Flags'],
	path: '/redflags',
	summary: 'Generate Red flags from EMRs of a patient, given patient phoneNumber',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		body: {
			content: {
				'application/json': {
					schema: RedFlagsGenerationRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: RedFlagsGenerationResponseSchema,
				},
			},
			description: 'Red flags generated successfully',
		},
		404: {
			content: {
				'application/json': {
					schema: NotFoundSchema,
				},
			},
			description: 'Not Found',
		},
	},
})

const redFlagsGenerationHandler = app.openapi(route, async (c) => {
	const { emrId, useMini } = c.req.valid('json')
	console.log(`Got request for red flags generation for EMR ID: ${emrId}`)
	const record = await db.select()
		.from(table.emr)
		.where(
			eq(table.emr.emrId, emrId),
		)
		.execute()
		.then((res) => res.at(0))

	if (!record) {
		return c.json({ error: 'No EMR record exists with the given EMR ID' }, 404)
	}

	const redFlags = await retry(() =>
		generateRedFlags({
			emr: record.content,
			useMini: useMini,
		}), retryOptions)

	await db
		.insert(table.redFlags)
		.values({
			emrId: emrId,
			redFlags: redFlags,
		})

	return c.json({ redFlags }, 200)
})

export type RedFlagsGenerationRoute = typeof redFlagsGenerationHandler
export default route
