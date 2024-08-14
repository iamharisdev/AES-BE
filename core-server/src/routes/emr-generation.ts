import app from '@/app'
import { createRoute, z } from '@hono/zod-openapi'
import { createPresignedGetUrl } from '@/services/storage'
import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { familyHistoryEmrSchema } from '@/schemas/family-history'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { medicalHistoryEmrSchema } from '@/schemas/medical-history'
import { getTranscription } from '@/services/transcription'
import { generateStructuredOutput } from '@/services/openai'

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
const serverErrorSchema = z.object({
    error: z.string().openapi({ example: 'Internal Server Error' }),
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
        500: {
            content: {
                'application/json': {
                    schema: serverErrorSchema,
                },
            },
            description: 'Internal Server Error',
        },
    },
})

// Main handler
const emrGenerationHandler = app.openapi(route, async (c) => {
    const { fileID } = c.req.valid('json')
    const bucket = process.env.UPLOAD_BUCKET || 'undefined'
    const downloadUrl = await createPresignedGetUrl({ bucket, key: fileID })

    const transcription = await getTranscription({ downloadUrl })

    // prettier-ignore
    const [currentPregnancy, previousPregnancy, familyHistory, socioEconomicHistory, medicalHistory] = await Promise.all([
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

    return c.json(
        {
            currentPregnancy,
            previousPregnancy,
            familyHistory,
            socioEconomicHistory,
            medicalHistory,
        },
        200
    )
})

export type EmrGenerationRoute = typeof emrGenerationHandler
export default route
