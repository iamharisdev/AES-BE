import { DiagnosticsSchema } from '@/schemas/diagnostics'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z, ZodSchema } from 'zod'

const client = new OpenAI()

type GenerateStructuredOutputArgs<ConditionSchema> = {
	schema: ZodSchema<ConditionSchema>
	schemaName: string
	transcription: string
	useMini: boolean
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
	const prompt =
		"You are a maternal healthcare expert proficient at understanding latin Urdu, which contains information in mixed Urdu and English. You are capable of creating accurate medical records from a given transcription, even if there are errors in it. You are able to fix those errors and use your own medical knowledge to understand the transcription and then create an electronic medical record from it. You will be provided with a transciption obtained from a maternal healthcare professional. This transcription will contain information about the patient and your job is to extract this information from the transcription. Your final output should be the EMR without any additional commentary. Any data not captured in the designated fields should be included under 'Additional Info'. Follow the JSON Schema provided to you exactly and only extract information available in the transcription. You will proceed with the available information."

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

export const generateDiagnostics = async ({
	emr,
	useMini,
}: GenerateDiagnosticsArgs) => {
	const sys_prompt =
		`You are an AI assistant acting as a maternal healthcare expert in Pakistan. Your task is to analyze patient information and provide a comprehensive health assessment and care plan. Use your medical knowledge and the provided context, considering the local healthcare system and practices in Pakistan when formulating your response.
        Based on patient's medical and health information, your task is to:
        1. Generate a detailed differential diagnosis:
            - Consider all symptoms, medical history, and current vitals.
            - List possible conditions or diseases that could explain the patient's presentation.
            - Provide clinical reasoning for each potential diagnosis and mention the vitals or medical information that lead to the conclusion.
            - Only include potential diagnoses that are supported by the provided information.
        2. Identify and analyze risk factors:
            - Evaluate personal, family, and socioeconomic factors that may impact the patient's health.
            - Consider the patient's education level, occupation, and other relevant personal details.
            - Assess how these factors might contribute to potential health issues.
        3. Develop a comprehensive proposed care plan:
            - Detail your proposed care plan.
            - Outline specific recommendations for treatment, monitoring, and follow-up care.
            - Include safe ranges and cutoff values for relevant health parameters (e.g., blood pressure, BMI).
            - Analyze any current medications and their potential effects on the patient's health.
            - Suggest appropriate lifestyle modifications or interventions.
            - Tailor recommendations to the local healthcare system and practices in Pakistan.
        Ensure each section is thorough, medically accurate, and addresses all relevant aspects of the patient's health and care. Tailor your response to the patient's specific situation and the healthcare environment in Pakistan.`

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
