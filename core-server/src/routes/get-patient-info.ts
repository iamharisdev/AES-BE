import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { getPatientInfo } from '@/services/patient'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const ParamSchema = z.object({
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
})

const SuccessResponseSchema = z.object({
	name: z.string().openapi({
		example: 'Nazia',
	}),
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	location: z.string().openapi({
		example: '45 A, Society, Main Road, Karachi',
	}),
})

const NotFoundSchema = z.object({
	error: z.string().openapi({
		example: 'No Record Found With Patient ID',
	}),
})

const route = createRoute({
	method: 'get',
	operationId: 'getPatientInfo',
	tags: ['Patient'],
	path: '/patient/info',
	summary: 'Allows the Heathcare Practitioner to Get Patient Info Such as Name and Location Based on their Phone',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		params: ParamSchema,
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
	const { phoneNumber } = c.req.valid('param')

	// check if the patient record already exists
	const patient = await getPatientInfo({ phoneNumber })

	if (!patient) {
		return c.json({ error: `No Patient Info Record found with phone number ${phoneNumber}` }, 404)
	}
	return c.json(patient, 200)
})

export type GetPatientInfoRoute = typeof handler

export default route
