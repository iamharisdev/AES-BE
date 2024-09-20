import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { DiagnosticsSchema } from '@/schemas/diagnostics'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	diagnostics: DiagnosticsSchema,
})

const NotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No EMR exists with the given EMR ID' }),
})

const route = createRoute({
	method: 'get',
	operationId: 'getDiagnostics',
	tags: ['Diagnostics'],
	path: '/diagnostics/{emrId}',
	summary: 'Generate diagnostics from EMRs of a patient, given EMR ID',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		params: z.object({
			emrId: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
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

const handler = app.openapi(route, async (c) => {
	const { emrId } = c.req.valid('param')
	const record = await db.select()
		.from(table.diagnostics)
		.where(
			eq(table.diagnostics.emrId, emrId),
		)
		.execute()
		.then((res) => res.at(0))

	if (!record) {
		return c.json({ error: 'No EMR record exists with the given EMR ID' }, 404)
	}
	const { content, ...rest } = record

	return c.json({ diagnostics: content }, 200)
})

export type GetDiagnosticsRoute = typeof handler
export default route
