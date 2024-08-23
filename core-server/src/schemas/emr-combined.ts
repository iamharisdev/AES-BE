import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { familyHistoryEmrSchema } from '@/schemas/family-history'
import { medicalHistoryEmrSchema } from '@/schemas/medical-history'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { z } from '@hono/zod-openapi'

// Response Schema
export const EmrGenerationSchema = z.object({
	currentPregnancy: currentPregnancyEmrSchema,
	previousPregnancy: previousPregnancyEmrSchema,
	familyHistory: familyHistoryEmrSchema,
	socioEconomicHistory: socioEconomicHistoryEmrSchema,
	medicalHistory: medicalHistoryEmrSchema,
}).openapi('EmrRecord')
