import { z } from 'zod'
import { durationOfLaborEnum, healthStatusEnum, modeOfDeliveryEnum, optionalNumber, sexEnum, yesNoEnum } from './enums'

const pregnancyDetails = z.object({
	pregnancyNumber: z.number(),
	yearOfBirth: optionalNumber,
	placeOfBirth: optionalNumber,
	spotInducedLabor: yesNoEnum,
	durationOfLabor: durationOfLaborEnum,
	modeOfDelivery: modeOfDeliveryEnum,
	maturityInWeeks: optionalNumber,
	postnatalComplications: yesNoEnum,
	puerperium: yesNoEnum,
	cerclage: yesNoEnum,
	pih: yesNoEnum,
	fetalAnomaly: yesNoEnum,
	rhIncompatibility: yesNoEnum,
	weightOfBaby: optionalNumber,
	ageOfBaby: optionalNumber,
	sexOfBaby: sexEnum,
	currentHealthStatusOfBaby: healthStatusEnum,
	additionalInfo: z.string().optional(),
})

export const previousPregnancyEmrSchema = z.object({
	pregnancies: z.array(pregnancyDetails),
})
