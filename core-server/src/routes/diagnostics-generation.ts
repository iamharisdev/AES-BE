import app from '@/app'
import { db } from '@/db'
import { env } from '@/env'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { DiagnosticsSchema } from '@/schemas/diagnostics'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { generateDiagnostics } from '@/services/openai'
import { createRoute, z } from '@hono/zod-openapi'
import { retry } from '@lifeomic/attempt'
import { eq } from 'drizzle-orm'

// Configuration for retry service
const retryOptions = {
	delay: 1000,
	factor: 2,
}

const DiagnosticGenerationRequestSchema = z.object({
	phoneNumber: z.string().openapi({ example: '03001234567' }),
	useMini: z.boolean().optional().default(false).openapi({
		description: 'whether to use small gpt model, (for testing) defaults to false',
	}),
})

const DiagnosticsGenerationResponseSchema = z.object({
	diagnostics: DiagnosticsSchema,
})

const NotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No patient exists with the given phone number' }),
})

const route = createRoute({
	method: 'post',
	operationId: 'diagnosticsGeneration',
	tags: ['Diagnostics'],
	path: '/diagnostics',
	summary: 'Generate diagnostics from EMRs of a patient, given patient phoneNumber',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		body: {
			content: {
				'application/json': {
					schema: DiagnosticGenerationRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: DiagnosticsGenerationResponseSchema,
				},
			},
			description: 'Diagnostics generated successfully',
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

const diagnosticsGenerationHandler = app.openapi(route, async (c) => {
	const { phoneNumber, useMini } = c.req.valid('json')
	const record = await db.select()
		.from(table.emr)
		.where(
			eq(table.emr.patientId, phoneNumber),
		)
		.execute()
		.then((res) => res.at(0))

	if (!record) {
		return c.json({ error: 'No patient exists with the given phone number' }, 404)
	}

	const diagnostics = await retry(() =>
		generateDiagnostics({
			emr: record.content,
			useMini: useMini,
		}), retryOptions)

	return c.json({ diagnostics }, 200)
})

export type DiagnosticsGenerationRoute = typeof diagnosticsGenerationHandler
export default route
