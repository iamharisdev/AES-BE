export const retryOptions = {
	retries: 3,
	delay: 1000,
	factor: 2,
	onRetry: (error: Error, attempt: number) => {
		console.warn(`Retry attempt ${attempt} failed: ${error.message}`)
	},
}
