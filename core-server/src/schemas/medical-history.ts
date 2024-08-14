import { z } from 'zod'
import { bloodGroupEnum, educationEnum, occupationEnum, nmcEnum, yesNoEnum } from './enums'

const personalDetails = z.object({
    bloodGroupSelf: bloodGroupEnum,
    educationSelf: educationEnum,
    occupationSelf: occupationEnum,
    marriedSince: z.union([z.number(),  z.literal('Not provided')]),
gravida: z.union([z.number(), z.literal('Not provided')]),
    para: z.union([z.number(),  z.literal('Not provided')]),
    miscarriage: z.union([z.number(),  z.literal('Not provided')]),
    abortion: z.union([z.number(), z.literal('Not provided')]),
    nmc: nmcEnum,
    consanguinousMarriage: yesNoEnum,
    vaginalBleedingSinceLastPeriod: yesNoEnum,
    contraceptives: yesNoEnum,
    smokingHistory: yesNoEnum,
    drugHistory: yesNoEnum,
    presentMedication: z.union([z.string(),  z.literal('Not provided')]),
})

const husbandDetails = z.object({
    husband_name: z.union([z.string(),  z.literal('Not provided')]),
    husband_age: z.union([z.number(),  z.literal('Not provided')]),
    husband_education: educationEnum,
    husband_bloodGroup: bloodGroupEnum,
    husband_occupation: occupationEnum,
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
    additionalInfo: z.string().optional(),
})
