import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const BodySchema = z.object({
	emrId: z.string(),
	content: EmrGenerationSchema,
})

const NotFoundSchema = z.object({
	error: z.string().openapi({
		example: 'No Record Found With Patient ID',
	}),
})

const route = createRoute({
	method: 'patch',
	operationId: 'patchEMR',
	tags: ['EMR'],
	path: '/emr',
	summary: 'Allows the Heathcare Practitioner to Edit/Patch EMR Contents',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		body: {
			content: {
				'application/json': {
					schema: BodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: 'Return the EMR Record',
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
	const { emrId, content } = c.req.valid('json')

	// TODO: Also check that doctor id should be same as emr Id for better authorization. skipping for now for easy testing

	const emr = await db
		.update(table.emr)
		.set({
			content,
		})
		.where(
			eq(table.emr.emrId, emrId),
		)
		.returning({ emrId: table.emr.emrId })
		.execute()
		.then(res => res.at(0)?.emrId)

	if (!emr) {
		return c.json({ error: `No Emr Record Found With Id ${emrId}` }, 404)
	}

	return c.json({ message: 'Success' }, 200)
})

export type PatchEmrRoute = typeof handler

export default route
