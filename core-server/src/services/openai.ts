import { ZodSchema } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import OpenAI from 'openai'

const client = new OpenAI()

type GenerateStructuredOutputArgs<ConditionSchema> = {
    schema: ZodSchema<ConditionSchema>
    schemaName: string
    transcription: string
}

export const generateStructuredOutput = async <ConditionSchema>({
    schema,
    schemaName,
    transcription,
}: GenerateStructuredOutputArgs<ConditionSchema>) => {
    // prettier-ignore
    const prompt = "You are an expert transcriptionist proficient at understanding latin Urdu, which contains information in mixed Urdu and English. The information is related to maternal health care. You are capable of creating accurate medical records from the transcription, even if there are errors in it. You are able to fix those errors and use your own medical knowledge to understand the transcription and then create an electronic medical record from it. You will be provided with a transciption obtained from a maternal healthcare professional. This transcription will contain information about the patient and your job is to extract this information from the transcription. Your final output should be the EMR without any additional commentary. Any data not captured in the designated fields should be included under 'Additional Info'. Follow the JSON Schema provided to you exactly. You will proceed with the available information."

    const completion = await client.beta.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
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
