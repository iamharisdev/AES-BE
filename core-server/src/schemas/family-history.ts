import { z } from 'zod'
import { yesNoEnum } from './enums'

export const patientFamilyHistory = z.object({
	diabetesInPatientsFamily: yesNoEnum,
	hypertensionInPatientsFamily: yesNoEnum,
	multiplePregnancyInPatientsFamily: yesNoEnum,
	haemoglobinopathiesTbInPatientsFamily: yesNoEnum,
	congenitalAnomaliesInPatientsFamily: yesNoEnum,
	additionalInfo: z.string().optional(),
})

export const husbandFamilyHistory = z.object({
	diabetesInHusbandsFamily: yesNoEnum,
	hypertensionInHusbandsFamily: yesNoEnum,
	multiplePregnancyInHusbandsFamily: yesNoEnum,
	haemoglobinopathiesTbInHusbandsFamily: yesNoEnum,
	congenitalAnomaliesInHusbandsFamily: yesNoEnum,
	additionalInfo: z.string().optional(),
})
