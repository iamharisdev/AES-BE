import app from '@/app';
import { createRoute, z } from '@hono/zod-openapi';
import { createPresignedGetUrl } from '@/services/storage';
import axios from 'axios';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { currentPregnancyEmr } from '../schemas/currentPregnancy';
import { previousPregnancyEmr } from '../schemas/previousPregnancy';
import { familyHistoryEmr } from '../schemas/familyHistory';
import { socioEconomicHistory } from '../schemas/socioEconomicHistory';
import { medicalHistoryEmr } from '../schemas/medicalHistory';

// Request Schema
const EmrGenerationRequestSchema = z.object({
  fileID: z.string().openapi({ example: '01F8MECHZX3TBDSZ7XRADM79XE.mp3' }),
});

// Response Schema
const EmrGenerationResponseSchema = z.object({
  currentPregnancyEmr: currentPregnancyEmr.openapi({}),
  previousPregnancyEmr: previousPregnancyEmr.openapi({}),
  familyHistoryEmr: familyHistoryEmr.openapi({}),
  socioEconomicHistory: socioEconomicHistory.openapi({}),
  medicalHistoryEmr: medicalHistoryEmr.openapi({})
});

// Error Schema
const serverErrorSchema = z.object({
  error: z.string().openapi({ example: 'Internal Server Error' }),
});

// Route definition
const route = createRoute({
  method: 'post',
  operationId: 'emrGeneration',
  tags: ['EMR'],
  path: '/emr/generate',
  summary: 'Generate multiple EMRs from audio file using Whisper on DataCrunch and OpenAI',
  request: {
    query: EmrGenerationRequestSchema,
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
});

// Helper function to get transcription from audio file using Whisper on DataCrunch given a signed URL form GCP
const getTranscription = async (downloadUrl: string) => {
  const url = 'https://inference.datacrunch.io/v1/audio/whisperx-v3/generate';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DATACRUNCH_API_KEY}`,
  };
  const data = { audio_input: downloadUrl, translate: true };

  const response = await axios.post(url, data, { headers });
  return response.data.segments[0].text;
};

const generateEmr = async (client: OpenAI, schema: any, schemaName: string, transcription: string) => {
  const prompt = "You are an expert transcriptionist proficient at understanding latin Urdu, which contains information in mixed Urdu and English. The information is related to maternal health care. You are capable of creating accurate medical records from the transcription, even if there are errors in it. You are able to fix those errors and use your own medical knowledge to understand the transcription and then create an electronic medical record from it. You will be provided with a transciption obtained from a maternal healthcare professional. This transcription will contain information about the patient and your job is to extract this information from the transcription. Your final output should be the EMR without any additional commentary. Any data not captured in the designated fields should be included under 'Additional Info'. Follow the JSON Schema provided to you exactly. You will proceed with the available information.";

  const completion = await client.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: transcription },
    ],
    response_format: zodResponseFormat(schema, schemaName),
  });

  const messageContent = completion.choices[0]?.message?.content;
  if (!messageContent) {
    throw new Error(`The response for ${schemaName} is null or undefined.`);
  }

  return JSON.parse(messageContent);
};

// Main handler
const emrGenerationHandler = app.openapi(route, async (c) => {
  try {
    const { fileID } = c.req.valid('query');
    const bucket = process.env.UPLOAD_BUCKET || 'undefined';
    const downloadUrl = await createPresignedGetUrl({ bucket, key: fileID });

    console.log('Download URL:', downloadUrl);

    const transcription = await getTranscription(downloadUrl);
    const client = new OpenAI();

    const [currentPregnancy, previousPregnancy, familyHistory, socioEconomic, medicalHistory] = await Promise.all([
      generateEmr(client, currentPregnancyEmr, "currentPregnancyEmr", transcription),
      generateEmr(client, previousPregnancyEmr, "previousPregnancyEmr", transcription),
      generateEmr(client, familyHistoryEmr, "familyHistoryEmr", transcription),
      generateEmr(client, socioEconomicHistory, "socioEconomicHistory", transcription),
      generateEmr(client, medicalHistoryEmr, "medicalHistoryEmr", transcription)
    ]);

    return c.json({
      currentPregnancyEmr: currentPregnancy,
      previousPregnancyEmr: previousPregnancy,
      familyHistoryEmr: familyHistory,
      socioEconomicHistory: socioEconomic,
      medicalHistoryEmr: medicalHistory
    }, 200);

  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'An error occurred while processing the request.' }, 500);
  }
});

export type EmrGenerationRoute = typeof emrGenerationHandler;
export default route;