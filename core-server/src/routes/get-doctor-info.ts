import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	name: z.string().openapi({
		example: 'Nazia',
	}),
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	maternityHomeName: z.string().openapi({
		example: 'Zacha Bacha Clinic',
	}),
})

const NotFoundSchema = z.object({
	error: z.string(),
})

const route = createRoute({
	method: 'get',
	operationId: 'getDoctorInfo',
	tags: ['Doctor'],
	path: '/doctor/info',
	summary: 'Fetch Details for the Health Practitioner',
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
		404: {
			content: {
				'application/json': {
					schema: NotFoundSchema,
				},
			},
			description: 'Register The User',
		},
	},
})

const handler = app.openapi(route, async (c) => {
	const { userType, phoneNumber } = c.get('jwtPayload')

	if (userType === 'patient') {
		return c.json({ error: `no doctor record exists with phone number ${phoneNumber}` }, 404)
	}

	// check if the patient record already exists
	const doctor = await db
		.select()
		.from(table.doctor)
		.where(
			eq(table.doctor.phone, phoneNumber),
		)
		.execute()
		.then(res => res.at(0))

	if (!doctor) {
		return c.json({ error: `no doctor record exists with phone number ${phoneNumber}` }, 404)
	}

	return c.json({
		phoneNumber,
		name: doctor.name,
		maternityHomeName: doctor.maternityHomeName,
	}, 200)
})

export type GetDoctorInfoRoute = typeof handler

export default route
