import app from '@/app'
import { db } from '@/db'
import { env } from '@/env'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { generateAllStructuredOutputs } from '@/services/openai'
import { createPresignedGetUrl, doesFileExists } from '@/services/storage'
import { getTranscription } from '@/services/transcription'
import { retryOptions } from '@/utils/retryConfig'
import { createRoute, z } from '@hono/zod-openapi'
import { retry } from '@lifeomic/attempt'
import { ulid } from 'ulidx'

// Request Schema
const EmrGenerationRequestSchema = z.object({
	fileID: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE.mp3' }),
	patientPhoneNumber: z.string().regex(/^\d{11,13}$/, 'Invalid phone number format').openapi({
		example: '03001234567',
	}),
	useMini: z.boolean().optional().default(false).openapi({
		description: 'Whether to use smaller GPT model (for testing), defaults to false',
	}),
})

const ResponseSchema = z.object({
	emrId: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE' }),
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
		400: {
			content: {
				'application/json': {
					schema: z.string().openapi({ example: 'Bad File Encoding' }),
				},
			},
			description: 'File Not Found',
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
	const transcription = await retry(() => getTranscription({ downloadUrl }), retryOptions)
	console.timeEnd('transcription')

	if ('clientError' in transcription) {
		return c.json('OPENAI: ' + transcription.clientError, 400)
	}

	console.time('gpt-structuring')
	const content = await generateAllStructuredOutputs(transcription.text, useMini)
	console.timeEnd('gpt-structuring')

	const emrId = ulid()

	await db
		.insert(table.emr)
		.values({
			doctorId: doctorPhoneNumber,
			patientId: patientPhoneNumber,
			emrId,
			content: content,
		})

	return c.json({
		emrId: emrId,
		content: content,
	}, 200)
})

export type EmrGenerationRoute = typeof emrGenerationHandler
export default route
