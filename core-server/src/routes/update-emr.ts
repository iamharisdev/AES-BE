import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

// Allowed sections
const validSections = new Set([
	'patientProfile',
	'presentingComplaint',
	'currentPregnancy',
	'secondThirdTrimesters',
	'obsHistory',
	'gynecologicalHistory',
	'pastMedicalHistory',
	'surgicalHistory',
	'familyHistory',
	'personalHistory',
	'socioEconomicHistory',
])

const UpdateEmrRequestSchema = z.object({
	emrId: z.string().uuid(),
	updates: z
		.array(
			z.object({
				section: z.string().refine((val) => validSections.has(val), {
					message: 'Invalid section name',
				}),
				content: z.object({}), // Content must be a valid JSON object
			}),
		)
		.min(1)
		.refine((updates) => {
			// Ensure no duplicate sections in request
			const sectionSet = new Set(updates.map((u) => u.section))
			return sectionSet.size === updates.length
		}, { message: 'Duplicate sections are not allowed' }),
})

const SuccessResponseSchema = z.object({
	message: z.string(),
	updatedFields: z.array(z.string()),
	lastmodified: z.string().datetime(),
})

const NotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No EMR record found with this ID' }),
})

const InternalServerErrorSchema = z.object({
	error: z.string().openapi({ example: 'Internal server error' }),
})

const route = createRoute({
	method: 'put',
	operationId: 'updateEmrSections',
	tags: ['EMR'],
	path: '/emr/updateEmrSections',
	summary: "Allows the Healthcare Practitioner to Update EMR's Sections. Valid sections:",
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		body: {
			content: {
				'application/json': {
					schema: UpdateEmrRequestSchema,
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
			description: 'Updated EMR Sections',
		},
		404: {
			content: {
				'application/json': {
					schema: NotFoundSchema,
				},
			},
			description: 'Not Found',
		},
		500: {
			content: {
				'application/json': {
					schema: InternalServerErrorSchema,
				},
			},
			description: 'Internal Server Error',
		},
	},
})

export const updateEmr =  () =>{



app.openapi(route, async (c) => {
	const { emrId, updates } = await c.req.json()

	// Check if EMR exists
	const existingEmr = await db
		.select()
		.from(table.emr)
		.where(eq(table.emr.emrId, emrId))
		.execute()
		.then((res) => res.at(0))

	if (!existingEmr) {
		return c.json({ error: `No EMR record found with ID ${emrId}` }, 404)
	}

	// Construct update object dynamically
	const updateData: Record<string, any> = {}
	updates.forEach((upd: any) => {
		updateData[upd.section] = upd.content
	})
	// Always update lastModifiedTime
	updateData['lastModifiedTime'] = new Date()

	// Perform update and get the last modified time
	const lastmodified = await db
		.update(table.emr)
		.set(updateData)
		.where(eq(table.emr.emrId, emrId))
		.returning({
			lastModifiedTime: table.emr.lastModifiedTime,
		})
		.execute()
		.then((res) => res.at(0)?.lastModifiedTime?.toISOString()) // Convert to ISO string

	if (!lastmodified) {
		return c.json(
			{ error: 'Failed to retrieve updated lastModifiedTime' },
			500,
		)
	}

	return c.json(
		{
			message: 'EMR updated successfully',
			updatedFields: updates.map((u: any) => u.section),
			lastmodified: lastmodified,
		},
		200,
	)
})
}


