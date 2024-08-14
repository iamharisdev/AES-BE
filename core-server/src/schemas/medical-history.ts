import { z } from 'zod'
import { bloodGroupEnum, educationEnum, occupationEnum, nmcEnum, yesNoEnum } from './enums'

const personalDetails = z.object({
    bloodGroupSelf: bloodGroupEnum,
    educationSelf: educationEnum,
    occupationSelf: occupationEnum,
    marriedSince: z.union([z.number(), yesNoEnum]),
    gravida: z.union([z.number(), yesNoEnum]),
    para: z.union([z.number(), yesNoEnum]),
    miscarriage: z.union([z.number(), yesNoEnum]),
    abortion: z.union([z.number(), yesNoEnum]),
    nmc: nmcEnum,
    consanguinousMarriage: yesNoEnum,
    vaginalBleedingSinceLastPeriod: yesNoEnum,
    contraceptives: yesNoEnum,
    smokingHistory: yesNoEnum,
    drugHistory: yesNoEnum,
    presentMedication: z.string(),
})

const husbandDetails = z.object({
    name: z.string(),
    age: z.string(),
    education: educationEnum,
    bloodGroup: bloodGroupEnum,
    occupation: occupationEnum,
})

const surgicalHistory = z.object({
    bloodTransfusion: yesNoEnum,
    infertility: yesNoEnum,
    anestheticProblem: yesNoEnum,
    operationAllergies: yesNoEnum,
})

const medicalHistory = z.object({
    diabetes: yesNoEnum,
    recurrentUti: yesNoEnum,
    cardiacProblem: yesNoEnum,
    hemoglobinopathy: yesNoEnum,
    endocrineDysfunction: yesNoEnum,
    anemia: yesNoEnum,
    hepatitis: yesNoEnum,
    hypertension: yesNoEnum,
})

export const medicalHistoryEmrSchema = z.object({
    personalDetails: personalDetails,
    husbandDetails: husbandDetails,
    medicalHistory: medicalHistory,
    surgicalHistory: surgicalHistory,
    additionalInfo: z.string(),
})
