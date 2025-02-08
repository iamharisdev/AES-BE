import { z } from '@hono/zod-openapi'

export const DiagnosticsSchema = z
	.object({
		diagnostics: z.string().openapi({ example: 'Patient has a fever' }),
		riskFactors: z
			.string()
			.openapi({ example: 'Patient has a history of diabetes' }),
		proposedPlan: z
			.string()
			.openapi({ example: 'Patient should be prescribed antibiotics' }),
	})
	.openapi('DiagnosticsRecord')
