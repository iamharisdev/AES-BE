import app from '@/app'
import { createRoute, z } from '@hono/zod-openapi'

const ParamsSchema = z.object({
	id: z
		.string()
		.min(3)
		// Attaching OpenAPI Metadata
		.openapi({
			param: {
				name: 'id',
				in: 'path',
			},
			example: '1212121',
		}),
})

const RequestBodySchema = z.object({
	name: z.string().optional().openapi({
		example: 'John Doe',
	}),
	age: z.number().optional().openapi({
		example: 42,
	}),
})
// This would create the object if it is reusable
// .openapi('ExampleBody')

const SuccessResponseSchema = z.object({
	message: z.string().default('Record Updated').openapi({
		example: 'John Doe Resource Updated',
	}),
})

const NotFoundResponseSchema = z.object({
	ok: z.boolean(),
	error: z.string().openapi({
		example: 'No Record Found With the ID 123',
	}),
})

const route = createRoute({
	method: 'patch',
	operationId: 'getUserById',
	tags: ['Example'],
	path: '/example/{id}',
	summary: 'A Sample API for testing out the Swagger UI',
	security: [{ jwt: [] }],
	request: {
		params: ParamsSchema,
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
			description: 'Retrieve the user',
		},
		400: {
			content: {
				'application/json': {
					schema: NotFoundResponseSchema,
				},
			},
			description: 'Retrieve the user',
		},
	},
})

const handler = app.openapi(route, async (c) => {
	// Get Validated Data With Correct Types Infered
	const params = c.req.valid('param')
	const body = c.req.valid('json')

	body.name // inferred as string | undefined
	body.age // inferred as number | undefined

	if (params.id === '0') {
		return c.json(
			{
				ok: false,
				error: 'Record Not Found With ID 0',
			},
			400,
		)
	}

	// Your Response Schema is Defined With
	return c.json({ message: 'Updated' }, 200)
})

export type ExampleRoute = typeof handler

export default route
