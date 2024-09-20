import { z } from 'zod'
import { bloodGroupEnum, educationEnum, nmcEnum, occupationEnum, optionalNumber, yesNoEnum } from './enums'

export const personalDetails = z.object({
	bloodGroupSelf: bloodGroupEnum,
	educationSelf: educationEnum,
	occupationSelf: occupationEnum,
	marriedSince: z.union([z.number(), z.literal('Not provided')]),
	gravida: z.union([z.number(), z.literal('Not provided')]),
	para: z.union([z.number(), z.literal('Not provided')]),
	miscarriage: z.union([z.number(), z.literal('Not provided')]),
	abortion: z.union([z.number(), z.literal('Not provided')]),
	nmc: nmcEnum,
	consanguinousMarriage: yesNoEnum,
	vaginalBleedingSinceLastPeriod: yesNoEnum,
	contraceptives: yesNoEnum,
	smokingHistory: yesNoEnum,
	drugHistory: yesNoEnum,
	presentMedication: optionalNumber,
	additionalInfo: z.string().optional(),
})

export const husbandDetails = z.object({
	husbandName: optionalNumber,
	husbandAge: optionalNumber,
	husbandEducation: educationEnum,
	husbandBloodGroup: bloodGroupEnum,
	husbandOccupation: occupationEnum,
	additionalInfo: z.string().optional(),
})

export const surgicalHistory = z.object({
	bloodTransfusion: yesNoEnum,
	infertility: yesNoEnum,
	anestheticProblem: yesNoEnum,
	operationAllergies: yesNoEnum,
	additionalInfo: z.string().optional(),
})

export const medicalHistoryEMR = z.object({
	diabetes: yesNoEnum,
	recurrentUti: yesNoEnum,
	cardiacProblem: yesNoEnum,
	hemoglobinopathy: yesNoEnum,
	endocrineDysfunction: yesNoEnum,
	anemia: yesNoEnum,
	hepatitis: yesNoEnum,
	hypertension: yesNoEnum,
	additionalInfo: z.string().optional(),
})
