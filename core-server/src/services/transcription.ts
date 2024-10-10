import OpenAI from 'openai'

const openai = new OpenAI()

export const getTranscription = async ({ downloadUrl }: { downloadUrl: string }): Promise<string> => {
	return openai.audio.translations.create({
		file: await fetch(downloadUrl),
		model: 'whisper-1',
	})
		.then(transcription => transcription.text)
		.catch(e => {
			console.log(e)
			throw e
		})
}
