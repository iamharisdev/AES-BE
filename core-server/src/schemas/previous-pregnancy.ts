import { z } from 'zod'
import { yesNoEnum, durationOfLaborEnum, modeOfDeliveryEnum, sexEnum, healthStatusEnum } from './enums'

const pregnancyDetails = z.object({
    yearOfBirth: z.union([z.number(), yesNoEnum]),
    placeOfBirth: z.union([z.string(), yesNoEnum]),
    spotInducedLabor: yesNoEnum,
    durationOfLabor: durationOfLaborEnum,
    modeOfDelivery: modeOfDeliveryEnum,
    maturityInWeeks: z.union([z.number(), yesNoEnum]),
    postnatalComplications: yesNoEnum,
    puerperium: yesNoEnum,
    cerclage: yesNoEnum,
    pih: yesNoEnum,
    fetalAnomaly: yesNoEnum,
    rhIncompatibility: yesNoEnum,
    weightOfBaby: z.union([z.number(), yesNoEnum]),
    ageOfBaby: z.union([z.number(), yesNoEnum]),
    sexOfBaby: sexEnum,
    currentHealthStatusOfBaby: healthStatusEnum,
    additionalInfo: z.string(),
})

export const previousPregnancyEmrSchema = z.object({
    pregnancies: z.array(pregnancyDetails),
})
