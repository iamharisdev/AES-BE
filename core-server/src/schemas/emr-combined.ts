import { currentPregnancyEmrSchema } from '@/schemas/current-pregnancy'
import { husbandFamilyHistory, patientFamilyHistory } from '@/schemas/family-history'
import { husbandDetails, medicalHistoryEMR, personalDetails, surgicalHistory } from '@/schemas/medical-history'
import { previousPregnancyEmrSchema } from '@/schemas/previous-pregnancy'
import { socioEconomicHistoryEmrSchema } from '@/schemas/socioeconomic-history'
import { z } from '@hono/zod-openapi'

// Response Schema
export const EmrGenerationSchema = z.object({
	currentPregnancy: currentPregnancyEmrSchema,
	previousPregnancy: previousPregnancyEmrSchema,
	patientFamilyHistory: patientFamilyHistory,
	husbandFamilyHistory: husbandFamilyHistory,
	socioEconomicHistory: socioEconomicHistoryEmrSchema,
	medicalHistory: medicalHistoryEMR,
	personalDetails: personalDetails,
	surgicalHistory: surgicalHistory,
	husbandDetails: husbandDetails,
}).openapi('EmrRecord')
