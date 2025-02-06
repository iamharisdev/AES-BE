import app from '@/app'
import { db } from '@/db'
import { env } from '@/env'
import { JwtPayload } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import { sha256 } from 'hono/utils/crypto'
const RequestBodySchema = z.object({
	name: z.string().openapi({
		example: 'Nazia',
	}),
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	password: z.string().openapi({
		example: 'xxxxxxxxx',
	}),
	maternityHomeName: z.string().openapi({
		example: 'Zacha Bacha',
	}),
})

const SuccessResponseSchema = z.object({
	message: z.string().openapi({
		example: 'Record Created',
	}),
	token: z.string().describe('JWT Token for Authentication'),
})

const ConflictSchema = z.object({
	error: z.string().openapi({
		example: 'Doctor with the ID is already Created',
	}),
})

const route = createRoute({
	method: 'post',
	operationId: 'registerDoctor',
	tags: ['Auth'],
	path: '/doctor/register',
	summary: 'Register the Health Practitioner in the system',
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
			description: 'User Already Exists',
		},
	},
})

const handler = app.openapi(route, async (c) => {
	const details = c.req.valid('json')

	// check if the user exists in the database
	const user = await db
		.select()
		.from(table.doctor)
		.where(eq(table.doctor.phoneNumber, details.phoneNumber))
		.then((user) => user.at(0))

	if (user) {
		return c.json(
			{
				error: `Record With Phone Number ${details.phoneNumber} already exists`,
			},
			409,
		)
	}

	await db.insert(table.doctor).values({
		doctorId: randomUUID(),
		name: details.name,
		phoneNumber: details.phoneNumber,
		encryptedPassword: (await sha256(details.password)) ?? '',
		maternityHomeName: details.maternityHomeName,
	})

	const jwtPayload: JwtPayload = {
		phoneNumber: details.phoneNumber,
		name: details.name,
		userType: 'doctor',
	}

	const token = await sign(jwtPayload, env.JWT_SECRET!, 'HS256')

	return c.json(
		{
			message: 'Account Created',
			token,
		},
		200,
	)
})

export type RegisterDoctorRoute = typeof handler

export default route
