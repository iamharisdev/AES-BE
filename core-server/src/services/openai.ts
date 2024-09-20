import { EmrGenerationRoute } from '@/routes/emr-generation'
import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { DiagnosticsSchema } from '@/schemas/diagnostics'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { husbandFamilyHistory, patientFamilyHistory } from '@/schemas/family-history'
import { husbandDetails, medicalHistoryEMR, personalDetails, surgicalHistory } from '@/schemas/medical-history'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { RedFlagsSchema } from '@/schemas/red-flags'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { diagnosticsPrompt, redFlagsPrompt, structuredOutputPrompt } from '@/utils/prompts'
import { retryOptions } from '@/utils/retryConfig'
import { retry } from '@lifeomic/attempt'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z, ZodSchema } from 'zod'

const client = new OpenAI()

export type GenerateStructuredOutputArgs<ConditionSchema> = {
	schema: ZodSchema<ConditionSchema>
	schemaName: string
	transcription: string
	useMini: boolean
}

const schemaMap: Record<string, GenerateStructuredOutputArgs<any>['schema']> = {
	currentPregnancy: currentPregnancyEmrSchema,
	previousPregnancy: previousPregnancyEmrSchema,
	husbandFamilyHistory: husbandFamilyHistory,
	patientFamilyHistory: patientFamilyHistory,
	socioEconomicHistory: socioEconomicHistoryEmrSchema,
	personalDetails: personalDetails,
	surgicalHistory: surgicalHistory,
	husbandDetails: husbandDetails,
	medicalHistory: medicalHistoryEMR,
}

type GenerateDiagnosticsArgs = {
	emr: z.infer<typeof EmrGenerationSchema>
	useMini: boolean
}

export const generateStructuredOutput = async <ConditionSchema>({
	schema,
	schemaName,
	transcription,
	useMini,
}: GenerateStructuredOutputArgs<ConditionSchema>) => {
	// prettier-ignore
	const prompt = structuredOutputPrompt

	const completion = await client.beta.chat.completions.parse({
		model: useMini ? 'gpt-4o-mini' : 'gpt-4o-2024-08-06',
		messages: [
			{
				role: 'system',
				content: prompt,
			},
			{
				role: 'user',
				content: transcription,
			},
		],
		response_format: zodResponseFormat(schema, schemaName),
	})

	// https://platform.openai.com/docs/guides/structured-outputs/introduction?lang=node.js
	const result = completion.choices[0].message
	if (!result.parsed) {
		throw new Error(`Refusal From Openai While Generating schema for ${schemaName}\nRefusal:${result.refusal}`)
	}

	return result.parsed
}

export const generateAllStructuredOutputs = async (transcription: string, useMini: boolean) => {
	const outputs = await Promise.all(
		Object.entries(schemaMap).map(([schemaName, schema]) =>
			retry(() =>
				generateStructuredOutput({
					schema,
					schemaName,
					transcription,
					useMini,
				} as GenerateStructuredOutputArgs<typeof schema>), retryOptions).then(output => [schemaName, output])
		),
	)
	return Object.fromEntries(outputs)
}

export const generateDiagnostics = async ({
	emr,
	useMini,
}: GenerateDiagnosticsArgs) => {
	const sys_prompt = diagnosticsPrompt

	const user_prompt =
		`Analyze the patient's Electronic Medical Record (EMR) given below and provide a detailed differential diagnosis, identify and analyze risk factors, and develop a comprehensive proposed care plan based on the patient's medical and health information as detailed in your instructions.

        EMR: ${JSON.stringify(emr)}

        ${sys_prompt}
        `
	const completion = await client.beta.chat.completions.parse({
		model: useMini ? 'gpt-4o-mini' : 'gpt-4o-2024-08-06',
		messages: [
			{
				role: 'system',
				content: sys_prompt,
			},
			{
				role: 'user',
				content: user_prompt,
			},
		],
		response_format: zodResponseFormat(DiagnosticsSchema, 'Diagnostics'),
	})
	const result = completion.choices[0].message
	if (!result.parsed) {
		throw new Error(`Refusal From Openai.\nRefusal:${result.refusal}`)
	}

	return result.parsed
}

export const generateRedFlags = async ({ emr, useMini }: GenerateDiagnosticsArgs) => {
	const sys_prompt = redFlagsPrompt
	const user_prompt = `Analyze the patient's Electronic Medical Record (EMR) given below and pin point red flags.

        EMR: ${JSON.stringify(emr)}

        ${sys_prompt}
        `
	const completion = await client.beta.chat.completions.parse({
		model: useMini ? 'gpt-4o-mini' : 'gpt-4o-2024-08-06',
		messages: [
			{
				role: 'system',
				content: sys_prompt,
			},
			{
				role: 'user',
				content: user_prompt,
			},
		],
		response_format: zodResponseFormat(RedFlagsSchema, 'RedFlags'),
	})
	const result = completion.choices[0].message
	if (!result.parsed) {
		throw new Error(`Refusal From Openai.\nRefusal:${result.refusal}`)
	}
	return result.parsed
}

