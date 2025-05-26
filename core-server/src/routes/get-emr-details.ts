import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { EMR } from '@/schemas/emr-combined'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	emrId: z.string(),
	patientId: z.string(),
	generationTime: z.date(),
	content: EMR,
})

const NotFoundSchema = z.object({
	error: z.string().openapi({
		example: 'No Record Found With Patient ID',
	}),
})

const route = createRoute({
	method: 'get',
	operationId: 'getEmr',
	tags: ['EMR'],
	path: '/emr/id/{emrId}',
	summary: 'Allows the Heathcare Practitioner to Get EMR Contents',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		params: z.object({
			emrId: z.string().openapi({ example: '01J860QF8AZXB1SMMXHXP2953A' }),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
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

export const getEmrRoute =  () =>{



app.openapi(route, async (c) => {
	const { emrId } = c.req.valid('param')

	console.debug(emrId)

	const emr = await db
		.select()
		.from(table.emr)
		.where(
			eq(table.emr.emrId, emrId),
		)
		.execute()
		.then(res => res.at(0))

	if (!emr) {
		return c.json({ error: `No Emr Record Found With Id ${emrId}` }, 404)
	}

	const { ...emrResponse } = emr
	return c.json(emrResponse, 200)
})
}


