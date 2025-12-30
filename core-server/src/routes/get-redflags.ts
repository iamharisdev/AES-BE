import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { RedFlagsSchema } from '@/schemas/red-flags'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	redFlags: RedFlagsSchema,
})

const NotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No EMR exists with the given EMR ID' }),
})

const route = createRoute({
	method: 'get',
	operationId: 'getRedFlags',
	tags: ['Red Flags'],
	path: '/redflags/{emrId}',
	summary: 'Generate Red flags from EMR of a patient, given EMR ID',
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
export const getRedFlagsRoute = () => {


app.openapi(route, async (c) => {
	const { emrId } = c.req.valid('param')
	const record = await db.select()
		.from(table.redFlags)
		.where(
			eq(table.redFlags.emrId, emrId),
		)
		.execute()
		.then((res) => res.at(0))

	if (!record) {
		return c.json({ error: 'No EMR record exists with the given EMR ID' }, 404)
	}
	const { redFlags, ...rest } = record

	return c.json({ redFlags }, 200)
})

}
