import { z } from 'zod'
import { bloodGroupEnum, educationEnum, nmcEnum, occupationEnum, optionalNumber, yesNoEnum } from './enums'

export const personalDetails = z.object({
	bloodGroupSelf: bloodGroupEnum,
	educationSelf: educationEnum,
	occupationSelf: occupationEnum,
	marriedSince: z.number().nullable(),
	gravida: z.number().nullable(),
	para: z.number().nullable(),
	miscarriage: z.number().nullable(),
	abortion: z.number().nullable(),
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
	husbandName: z.string().nullable(),
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
