import app from '@/app'
import { db } from '@/db'
import { env } from '@/env'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { familyHistoryEmrSchema } from '@/schemas/family-history'
import { medicalHistoryEmrSchema } from '@/schemas/medical-history'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { generateStructuredOutput } from '@/services/openai'
import { createPresignedGetUrl, doesFileExists } from '@/services/storage'
import { getTranscription } from '@/services/transcription'
import { createRoute, z } from '@hono/zod-openapi'
import { retry } from '@lifeomic/attempt'
import { ulid } from 'ulidx'

// Configuration for retry service
const retryOptions = {
	delay: 1000,
	factor: 2,
}

// Request Schema
const EmrGenerationRequestSchema = z.object({
	fileID: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE.mp3' }),
	patientPhoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	useMini: z.boolean().optional().default(false).openapi({
		description: 'whether to use small gpt model, (for testing) defaults to false',
	}),
})

const ResponseSchema = z.object({
	emrId: z.string(),
	content: EmrGenerationSchema,
})

// Error Schema
const NotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No File Exists with the Key' }),
})

// Route definition
const route = createRoute({
	method: 'post',
	operationId: 'emrGeneration',
	tags: ['EMR'],
	path: '/emr/generate',
	summary: 'Generate multiple EMRs from audio file using Whisper on DataCrunch and OpenAI',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],
	request: {
		body: {
			content: {
				'application/json': {
					schema: EmrGenerationRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ResponseSchema,
				},
			},
			description: 'EMR generated successfully',
		},
		404: {
			content: {
				'application/json': {
					schema: NotFoundSchema,
				},
			},
			description: 'File Not Found',
		},
		401: {
			content: {
				'text/plain': {
					schema: z.string().openapi({ example: 'Unauthorized' }),
				},
			},
			description: 'Unauthorized',
		},
	},
})

// Main handler
const emrGenerationHandler = app.openapi(route, async (c) => {
	const { fileID, patientPhoneNumber, useMini } = c.req.valid('json')
	const bucket = env.UPLOAD_BUCKET || 'undefined'
	const fileExists = await doesFileExists({ bucket, key: fileID })
	const doctorPhoneNumber = c.get('jwtPayload').phoneNumber

	if (!fileExists) {
		// This will also handle the case where
		return c.json(
			{
				error: `No File Exists with path ${bucket}/${fileID}`,
			},
			404,
		)
	}

	const downloadUrl = await createPresignedGetUrl({ bucket, key: fileID })

	console.time('transcription')
	const transcription = await retry(() => getTranscription({ downloadUrl }))
	console.timeEnd('transcription')

	console.time('gpt-structuring')
	const [
		currentPregnancy,
		previousPregnancy,
		familyHistory,
		socioEconomicHistory,
		medicalHistory,
	] = await Promise
		.all([
			retry(() =>
				generateStructuredOutput({
					schema: currentPregnancyEmrSchema,
					schemaName: 'current_pregnancy',
					transcription,
					useMini,
				}), retryOptions),
			retry(() =>
				generateStructuredOutput({
					schema: previousPregnancyEmrSchema,
					schemaName: 'previous_pregnancy',
					transcription,
					useMini,
				}), retryOptions),
			retry(() =>
				generateStructuredOutput({
					schema: familyHistoryEmrSchema,
					schemaName: 'family_history',
					transcription,
					useMini,
				}), retryOptions),
			retry(() =>
				generateStructuredOutput({
					schema: socioEconomicHistoryEmrSchema,
					schemaName: 'socioeconomic_history',
					transcription,
					useMini,
				}), retryOptions),
			retry(() =>
				generateStructuredOutput({
					schema: medicalHistoryEmrSchema,
					schemaName: 'medical_history',
					transcription,
					useMini,
				}), retryOptions),
		])
	console.timeEnd('gpt-structuring')

	const emrId = ulid()

	const content = {
		currentPregnancy,
		previousPregnancy,
		familyHistory,
		socioEconomicHistory,
		medicalHistory,
	}

	await db
		.insert(table.emr)
		.values({
			doctorId: doctorPhoneNumber,
			patientId: patientPhoneNumber,
			emrId,
			content,
		})

	return c.json({
		emrId,
		content,
	}, 200)
})

export type EmrGenerationRoute = typeof emrGenerationHandler
export default route
