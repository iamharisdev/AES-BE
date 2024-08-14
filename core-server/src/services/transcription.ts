import { z } from '@hono/zod-openapi'
import axios from 'axios'

// Helper function to get transcription from audio file using Whisper on DataCrunch given a signed URL form GCP
export const getTranscription = async ({ downloadUrl }: { downloadUrl: string }) => {
    const url = 'https://inference.datacrunch.io/v1/audio/whisperx-v3/generate'
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DATACRUNCH_API_KEY}`,
    }
    const data = { audio_input: downloadUrl, translate: true } // , language: 'urdu'

    const response = await axios.post(url, data, { headers })

    return z.string({ message: 'Incorrect Response From Datacrunch API' }).parse(response.data?.segments?.at(0)?.text)
}
