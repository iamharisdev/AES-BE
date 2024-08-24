import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { createRoute, z } from '@hono/zod-openapi'
import { and, eq, gt, lt, sql } from 'drizzle-orm'

const SuccessResponseSchema = z.array(
	z.object({
		emrId: z.string(),
		patientId: z.string(),
		generationTime: z.date(),
		content: EmrGenerationSchema,
	}),
)

const route = createRoute({
	method: 'get',
	operationId: 'listEmrs',
	tags: ['EMR'],
	path: '/emr',
	summary: 'Allows the Heathcare Practitioner to List Emr Records',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		query: z.object({
			patientId: z.string().optional().openapi({
				example: '03001234567',
			}),
			startTime: z.date().optional(),
			endTime: z.date().optional(),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'Register The User',
		},
	},
})

const handler = app.openapi(route, async (c) => {
	const { patientId, startTime, endTime } = c.req.valid('query')
	const doctorId = c.get('jwtPayload').phoneNumber

	const emrs = await db
		.select({
			emrId: table.emr.emrId,
			patientId: table.emr.patientId,
			generationTime: table.emr.generationTime,
			content: table.emr.content,
		})
		.from(table.emr)
		.where(
			and(
				eq(table.emr.doctorId, doctorId),
				patientId ? eq(table.emr.patientId, patientId) : sql`true`,
				startTime ? gt(table.emr.generationTime, startTime) : undefined,
				endTime ? lt(table.emr.generationTime, endTime) : undefined,
			),
		)
		.execute()

	return c.json(emrs, 200)
})

export type ListEmrsRoute = typeof handler

export default route
