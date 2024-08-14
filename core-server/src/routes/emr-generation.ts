import app from '@/app'
import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { familyHistoryEmrSchema } from '@/schemas/family-history'
import { medicalHistoryEmrSchema } from '@/schemas/medical-history'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { generateStructuredOutput } from '@/services/openai'
import { createPresignedGetUrl, doesFileExists } from '@/services/storage'
import { getTranscription } from '@/services/transcription'
import { createRoute, z } from '@hono/zod-openapi'

// Request Schema
const EmrGenerationRequestSchema = z.object({
	fileID: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE.mp3' }),
})

// Response Schema
const EmrGenerationResponseSchema = z.object({
	currentPregnancy: currentPregnancyEmrSchema,
	previousPregnancy: previousPregnancyEmrSchema,
	familyHistory: familyHistoryEmrSchema,
	socioEconomicHistory: socioEconomicHistoryEmrSchema,
	medicalHistory: medicalHistoryEmrSchema,
})

// Error Schema
const audioNotFoundSchema = z.object({
	error: z.string().openapi({ example: 'No File Exists with the Key' }),
})

// Route definition
const route = createRoute({
	method: 'post',
	operationId: 'emrGeneration',
	tags: ['EMR'],
	path: '/emr/generate',
	summary: 'Generate multiple EMRs from audio file using Whisper on DataCrunch and OpenAI',
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
					schema: EmrGenerationResponseSchema,
				},
			},
			description: 'EMR generated successfully',
		},
		404: {
			content: {
				'application/json': {
					schema: audioNotFoundSchema,
				},
			},
			description: 'File Not Found',
		},
	},
})

// Main handler
const emrGenerationHandler = app.openapi(route, async (c) => {
	const { fileID } = c.req.valid('json')
	const bucket = process.env.UPLOAD_BUCKET || 'undefined'
	const fileExists = await doesFileExists({ bucket, key: fileID })

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
	const transcription = await getTranscription({ downloadUrl })
	console.timeEnd('transcription')

	console.time('gpt-structuring')
	// prettier-ignore
	const [currentPregnancy, previousPregnancy, familyHistory, socioEconomicHistory, medicalHistory] = await Promise
		.all([
			generateStructuredOutput({
				schema: currentPregnancyEmrSchema,
				schemaName: 'current_pregnancy',
				transcription,
			}),
			generateStructuredOutput({
				schema: previousPregnancyEmrSchema,
				schemaName: 'previous_pregnancy',
				transcription,
			}),
			generateStructuredOutput({
				schema: familyHistoryEmrSchema,
				schemaName: 'family_history',
				transcription,
			}),
			generateStructuredOutput({
				schema: socioEconomicHistoryEmrSchema,
				schemaName: 'socioeconomic_history',
				transcription,
			}),
			generateStructuredOutput({
				schema: medicalHistoryEmrSchema,
				schemaName: 'medical_history',
				transcription,
			}),
		])
	console.timeEnd('gpt-structuring')

	return c.json(
		{
			currentPregnancy,
			previousPregnancy,
			familyHistory,
			socioEconomicHistory,
			medicalHistory,
		},
		200,
	)
})

export type EmrGenerationRoute = typeof emrGenerationHandler
export default route
