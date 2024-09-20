import { z } from 'zod'

export const RedFlagsSchema = z.object({
	redFlags: z.array(z.string()),
})
