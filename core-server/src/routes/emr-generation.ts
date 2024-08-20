import app from '@/app'
import { env } from '@/env'
import { jwtMiddleware } from '@/middleware/jwt'
import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { familyHistoryEmrSchema } from '@/schemas/family-history'
import { medicalHistoryEmrSchema } from '@/schemas/medical-history'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { generateStructuredOutput } from '@/services/openai'
import { retryService } from '@/services/retryService'
import { createPresignedGetUrl, doesFileExists } from '@/services/storage'
import { getTranscription } from '@/services/transcription'
import { createRoute, z } from '@hono/zod-openapi'
import { ulid } from 'ulidx'

// Request Schema
const EmrGenerationRequestSchema = z.object({
	fileID: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE.mp3' }),
	patientPhoneNumber: z.string().openapi({
		example: '03001234567',
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
	const { fileID } = c.req.valid('json')
	const bucket = env.UPLOAD_BUCKET || 'undefined'
	const fileExists = await doesFileExists({ bucket, key: fileID })
	const { phoneNumber } = c.get('jwtPayload')

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
	const transcription = await retryService(() => getTranscription({ downloadUrl }))
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
			retryService(() =>
				generateStructuredOutput({
					schema: currentPregnancyEmrSchema,
					schemaName: 'current_pregnancy',
					transcription,
				})
			),
			retryService(() =>
				generateStructuredOutput({
					schema: previousPregnancyEmrSchema,
					schemaName: 'previous_pregnancy',
					transcription,
				})
			),
			retryService(() =>
				generateStructuredOutput({
					schema: familyHistoryEmrSchema,
					schemaName: 'family_history',
					transcription,
				})
			),
			retryService(() =>
				generateStructuredOutput({
					schema: socioEconomicHistoryEmrSchema,
					schemaName: 'socioeconomic_history',
					transcription,
				})
			),
			retryService(() =>
				generateStructuredOutput({
					schema: medicalHistoryEmrSchema,
					schemaName: 'medical_history',
					transcription,
				})
			),
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

	// use Phone Number to insert schema

	return c.json({
		emrId,
		content,
	}, 200)
})

export type EmrGenerationRoute = typeof emrGenerationHandler
export default route
