import app from '@/app'
import { db } from '@/db'
import { env } from '@/env'
import { JwtPayload, User } from '@/middleware/jwt'
import { schema } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import { sha256 } from 'hono/utils/crypto'

const LoginRequestBodySchema = z.object({
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	password: z.string().openapi({
		example: 'xxxxxxxxx',
	}),
})

const LoginSuccessResponseSchema = z.object({
	message: z.string().openapi({
		example: 'Login Successful',
	}),
	token: z.string().describe('JWT Token for Authentication'),
})

const UnauthorizedSchema = z.object({
	error: z.string().openapi({
		example: 'Invalid phone number or password',
	}),
})

const route = createRoute({
	method: 'post',
	operationId: 'loginDoctor',
	tags: ['Auth'],
	path: '/doctor/login',
	summary: 'Login the Health Practitioner in the system',
	request: {
		body: {
			content: {
				'application/json': {
					schema: LoginRequestBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: LoginSuccessResponseSchema,
				},
			},
			description: 'Login Successful',
		},
		401: {
			content: {
				'application/json': {
					schema: UnauthorizedSchema,
				},
			},
			description: 'Unauthorized',
		},
	},
})

const loginHandler = app.openapi(route, async (c) => {
	const details = c.req.valid('json')

	// check if the user exists in the database
	const user = await db
		.select()
		.from(schema.doctor)
		.where(eq(schema.doctor.phone, details.phoneNumber))
		.then((user) => user.at(0))

	if (!user) {
		return c.json(
			{
				error: 'Invalid phone number or password',
			},
			401,
		)
	}

	// verify password
	const encryptedPassword = (await sha256(details.password)) ?? ''
	if (user.encryptedPassword !== encryptedPassword) {
		return c.json(
			{
				error: 'Invalid phone number or password',
			},
			401,
		)
	}

	const jwtPayload: JwtPayload = {
		phoneNumber: details.phoneNumber,
		name: '',
		userType: 'doctor',
	}

	const token = await sign(jwtPayload, env.JWT_SECRET!, 'HS256')
	return c.json(
		{
			message: 'Login Successful',
			token,
		},
		200,
	)
})

export type LoginDoctorRoute = typeof loginHandler
export default route
