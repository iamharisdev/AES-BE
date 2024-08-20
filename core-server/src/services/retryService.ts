/**
 * Executes an asynchronous function with retry logic.
 * @throws Will throw an error if all retry attempts fail.
 * @example
 * const result = await retryService(() => fetchData('https://api.example.com'), 5, 2000);
 */
export const retryService = async <T>(
	asyncFunction: () => Promise<T>,
	retries: number = 3,
	delay: number = 1000,
): Promise<T> => {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			return await asyncFunction()
		} catch (e) {
			if (attempt === retries - 1) {
				throw e
			}
			console.log(`Retrying attempt ${attempt + 1} after ${delay}ms`)
			await new Promise(resolve => setTimeout(resolve, delay))
		}
	}
	throw new Error('Unreachable') // to satisfy TypeScript
}
