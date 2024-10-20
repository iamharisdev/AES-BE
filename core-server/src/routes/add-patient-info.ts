import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { getPatientInfo } from '@/services/patient'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const RequestBodySchema = z.object({
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

const SuccessResponseSchema = z.object({
	message: z.string().openapi({
		example: 'Record Created',
	}),
})

const ConflictSchema = z.object({
	error: z.string().openapi({
		example: 'Patient Info with the ID already Exists',
	}),
})

const route = createRoute({
	method: 'post',
	operationId: 'addPatientInfo',
	tags: ['Patient'],
	path: '/patient/info',
	summary: 'Allows the Heathcare Practitioner to Add Patient Info Such as Phone, Name and Location',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		body: {
			content: {
				'application/json': {
					schema: RequestBodySchema,
				},
			},
		},
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
		409: {
			content: {
				'application/json': {
					schema: ConflictSchema,
				},
			},
			description: 'Record Already Exists',
		},
	},
})

const handler = app.openapi(route, async (c) => {
	const { phoneNumber } = c.get('jwtPayload')
	const info = c.req.valid('json')

	// check if the patient record already exists
	const patient = await getPatientInfo({ phoneNumber: info.phoneNumber })

	if (patient) {
		return c.json({ error: `Patient With Phone Number ${info.phoneNumber} Already Exists` }, 409)
	}

	await db.insert(table.patient.info).values({ ...info, doctorId: phoneNumber })

	return c.json({ message: 'Patient Record Created' }, 200)
})

export type AddPatientInfoRoute = typeof handler

export default route
