/**
 * Executes a service function with retry logic.
 *
 * @template T The return type of the service function.
 * @template Args The argument types of the service function.
 *
 * @param {Object} options - The options for the retry service.
 * @param {(...args: Args) => Promise<T>} options.service - The asynchronous service function to be executed.
 * @param {Args} options.args - The arguments to pass to the service function.
 * @param {number} [options.retries=3] - The maximum number of retry attempts.
 * @param {number} [options.delay=1000] - The delay in milliseconds between retry attempts.
 *
 * @returns {Promise<T>} A promise that resolves with the result of the service function.
 *
 * @throws Will throw an error if all retry attempts fail.
 *
 * @example
 * const result = await retryService({
 *   service: fetchData,
 *   args: ['https://api.example.com'],
 *   retries: 5,
 *   delay: 2000,
 * });
 */

export const retryService = async <T, Args extends any[]>(
	{ service, retries = 3, delay = 1000, args }: {
		service: (...args: Args) => Promise<T>
		retries?: number
		delay?: number
		args: Args
	},
): Promise<T> => {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			return await service(...args)
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
