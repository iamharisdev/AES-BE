import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	patients: z.array(
		z.object({
			name: z.string().openapi({
				example: 'Nazia',
			}),
			phoneNumber: z.string().openapi({
				example: '03001234567',
			}),
			location: z.string().openapi({
				example: '45 A, Society, Main Road, Karachi',
			}),
			createdAt: z.string(),
		}),
	),
})

const route = createRoute({
	method: 'get',
	operationId: 'listPatientsInfo',
	tags: ['Patient'],
	path: '/patient/info',
	summary: 'Retreives all the patients added by a Healthcare Provider',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
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
	const { phoneNumber } = c.get('jwtPayload')

	const patients = await db
		.select({
			name: table.patient.info.name,
			phoneNumber: table.patient.info.phoneNumber,
			location: table.patient.info.location,
			createdAt: table.patient.info.createdAt,
		})
		.from(table.patient.info)
		.where(
			eq(table.patient.info.doctorId, phoneNumber),
		)
		.execute()

	return c.json({ patients }, 200)
})

export type ListPatientInfoRoute = typeof handler

export default route
