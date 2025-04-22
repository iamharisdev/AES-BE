import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { EMR } from '@/schemas/emr-combined'
import { createRoute, z } from '@hono/zod-openapi'
import { eq, sql } from 'drizzle-orm'

const SuccessResponseSchema = z.object({
	emrs: z.array(
		z.object({
			phone: z.string(),
			visit: z.number(),
			generationTime: z.date(),
			lastModifiedTime: z.date(),
			patientProfile: z.record(z.unknown()), // JSON structure
			presentingComplaint: z.record(z.unknown()),
			currentPregnancy: z.record(z.unknown()),
			secondThirdTrimesters: z.record(z.unknown()),
			obsHistory: z.record(z.unknown()),
			gynecologicalHistory: z.record(z.unknown()),
			pastMedicalHistory: z.record(z.unknown()),
			surgicalHistory: z.record(z.unknown()),
			familyHistory: z.record(z.unknown()),
			personalHistory: z.record(z.unknown()),
			socioEconomicHistory: z.record(z.unknown()),
			emrId: z.string().uuid(),
		}),
	),
	prevPregnancies: z.array(z.record(z.unknown())),
})

const NotFoundSchema = z.object({
	error: z.string().openapi({
		example: 'No EMR records found for this phone number',
	}),
})

const route = createRoute({
	method: 'get',
	operationId: 'getAllEmrsFromPhone',
	tags: ['EMR'],
	path: '/emr/getAllEmrsFromPhone/{phoneNumber}',
	summary: 'Allows the Healthcare Practitioner to Get All EMRs for a Patient',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		params: z.object({
			phoneNumber: z.string().openapi({ example: '3123456789' }),
		}),
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'Returns all EMR records for the given phone number',
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

	// Fetch all EMRs for the given phone number
	  const emrs = await db
    .select({
      phone: table.emr.phone,
      visit: table.emr.visit,
      generationTime: table.emr.generationTime,
      lastModifiedTime: table.emr.lastModifiedTime,
      patientProfile: table.emr.patientProfile,
      presentingComplaint: table.emr.presentingComplaint,
      currentPregnancy: table.emr.currentPregnancy,
      secondThirdTrimesters: table.emr.secondThirdTrimesters,
      obsHistory: table.emr.obsHistory,
      gynecologicalHistory: table.emr.gynecologicalHistory,
      pastMedicalHistory: table.emr.pastMedicalHistory,
      surgicalHistory: table.emr.surgicalHistory,
      familyHistory: table.emr.familyHistory,
      personalHistory: table.emr.personalHistory,
      socioEconomicHistory: table.emr.socioEconomicHistory,
      emrId: table.emr.emrId,
      hasExamination: sql<boolean>`CASE WHEN ${table.examinationDetails.emrId} IS NOT NULL THEN TRUE ELSE FALSE END`,
    })
    .from(table.emr)
    .leftJoin(
      table.examinationDetails,
      eq(table.emr.emrId, table.examinationDetails.emrId)
    )
    .where(eq(table.emr.phone, phoneNumber))
    .execute();

	if (!emrs || emrs.length === 0) {
		return c.json({ error: `No EMR records found for phone number ${phoneNumber}` }, 404)
	}

	const patientInfo = await db
		.select()
		.from(table.patient.info)
		.where(eq(table.patient.info.phone, phoneNumber))
		.execute()

	if (!patientInfo || patientInfo.length === 0) {
		return c.json({ error: `No Patient records found for phone number ${phoneNumber}` }, 404)
	}

	const prevPregnancies = patientInfo[0].prevPregnancies

	return c.json({ emrs, prevPregnancies }, 200)
})

export type GetAllEmrsFromPhone = typeof handler

export default route
