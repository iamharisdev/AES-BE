import { z } from 'zod'
import { durationOfLaborEnum, healthStatusEnum, modeOfDeliveryEnum, sexEnum, yesNoEnum } from './enums'

const pregnancyDetails = z.object({
	yearOfBirth: z.union([z.number(), z.literal('Not provided')]),
	placeOfBirth: z.union([z.string(), z.literal('Not provided')]),
	spotInducedLabor: yesNoEnum,
	durationOfLabor: durationOfLaborEnum,
	modeOfDelivery: modeOfDeliveryEnum,
	maturityInWeeks: z.union([z.number(), z.literal('Not provided')]),
	postnatalComplications: yesNoEnum,
	puerperium: yesNoEnum,
	cerclage: yesNoEnum,
	pih: yesNoEnum,
	fetalAnomaly: yesNoEnum,
	rhIncompatibility: yesNoEnum,
	weightOfBaby: z.union([z.number(), z.literal('Not provided')]),
	ageOfBaby: z.union([z.number(), z.literal('Not provided')]),
	sexOfBaby: sexEnum,
	currentHealthStatusOfBaby: healthStatusEnum,
	additionalInfo: z.string().optional(),
})

export const previousPregnancyEmrSchema = z.object({
	pregnancies: z.array(pregnancyDetails),
})
