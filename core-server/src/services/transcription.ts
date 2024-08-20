import { env } from '@/env'
import { z } from '@hono/zod-openapi'

// Helper function to get transcription from audio file using Whisper on DataCrunch given a signed URL form GCP
export const getTranscription = async ({ downloadUrl }: { downloadUrl: string }) => {
	const url = 'https://inference.datacrunch.io/v1/audio/whisperx-v3/generate'
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${env.DATACRUNCH_API_KEY}`,
	}
	const body = JSON.stringify({ audio_input: downloadUrl, translate: true })

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body,
	})

	if (!response.ok) {
		throw new Error(
			`Whisper Inference Failed. ${response.status}, ${response.statusText}, ${await response.text()}`,
		)
	}
	const data = await response.json()
	return z.string({ message: 'Incorrect Response From Datacrunch API' }).parse(data?.segments?.at(0)?.text)
}
