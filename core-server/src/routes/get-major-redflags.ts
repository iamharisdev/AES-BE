import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	redFlags: z.array(z.object({
		emrId: z.string(),
		phone: z.string(),
		visit: z.number(),
		generationTime: z.string(),
		redFlags: z.array(z.any()),
		followupQuestions: z.array(z.any())
	})),
	majorRedFlags: z.array(z.object({
		flag: z.string(),
		count: z.number(),
		percentage: z.number()
	})),
	totalMajorFlags: z.number()
})

const route = createRoute({
	method: 'get',
	operationId: 'getMajorRedFlags',
	tags: ['Red Flags'],
	path: '/emr/redflags',
	summary: 'Get all EMRs with red flags and identify major red flags',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'Red flags and major red flags retrieved successfully',
		},
	},
})

export const getMajorRedFlags = () => {
	app.openapi(route, async (c) => {
		// First get all records with red flags
		const records = await db.select({
			emrId: table.emr.emrId,
			phone: table.emr.phone,
			visit: table.emr.visit,
			generationTime: table.emr.generationTime,
			redFlags: table.emr.redFlags,
			followupQuestions: table.emr.followups
		})
			.from(table.emr)
			.where(sql`${table.emr.redFlags}::jsonb @> '[]'::jsonb = false`)
			.execute()

		// Count occurrences of each flag
		const flagCounts: Record<string, number> = {}
		records.forEach(record => {
			record?.redFlags?.forEach((redFlag: any) => {
				if (redFlag.flag) {
					flagCounts[redFlag.flag] = (flagCounts[redFlag.flag] || 0) + 1
				}
			})
		})

		// Calculate total number of EMRs with red flags
		const totalEmrs = records.length

		// Convert to array, add percentage, and sort by count
		const majorRedFlags = Object.entries(flagCounts)
			.map(([flag, count]) => ({
				flag,
				count,
				percentage: Number(((count / totalEmrs) * 100).toFixed(2))
			}))
			.sort((a, b) => b.count - a.count)

		// Calculate total count of major flags (flags that appear more than once)
		const totalMajorFlags = majorRedFlags
			.filter(flag => flag.count > 1)
			.reduce((sum, flag) => sum + flag.count, 0)

		return c.json({ 
			redFlags: records,
			majorRedFlags,
			totalMajorFlags
		}, 200)
	})
}

