import OpenAI, { OpenAIError } from 'openai'

const openai = new OpenAI()

export const getTranscription = async ({ downloadUrl }: { downloadUrl: string }) => {
	return openai.audio.translations.create({
		file: await fetch(downloadUrl),
		model: 'whisper-1',
	})
		.then(({ text }) => ({ text }))
		.catch(e => {
			if (e instanceof OpenAIError) {
				return { clientError: e.message }
			}
			console.log(e)
			throw e
		})
}
