import { z } from 'zod'
import { bloodGroupEnum, educationEnum, occupationEnum, nmcEnum, yesNoEnum } from './enums'

const personalDetails = z.object({
    bloodGroupSelf: bloodGroupEnum.optional(),
    educationSelf: educationEnum.optional(),
    occupationSelf: occupationEnum.optional(),
    marriedSince: z.union([z.number(), yesNoEnum]).optional(),
    gravida: z.union([z.number(), yesNoEnum]).optional(),
    para: z.union([z.number(), yesNoEnum]).optional(),
    miscarriage: z.union([z.number(), yesNoEnum]).optional(),
    abortion: z.union([z.number(), yesNoEnum]).optional(),
    nmc: nmcEnum.optional(),
    consanguinousMarriage: yesNoEnum.optional(),
    vaginalBleedingSinceLastPeriod: yesNoEnum.optional(),
    contraceptives: yesNoEnum.optional(),
    smokingHistory: yesNoEnum.optional(),
    drugHistory: yesNoEnum.optional(),
    presentMedication: z.string().optional(),
})

const husbandDetails = z.object({
    name: z.string().optional(),
    age: z.string().optional(),
    education: educationEnum.optional(),
    bloodGroup: bloodGroupEnum.optional(),
    occupation: occupationEnum.optional(),
})

const surgicalHistory = z.object({
    bloodTransfusion: yesNoEnum.optional(),
    infertility: yesNoEnum.optional(),
    anestheticProblem: yesNoEnum.optional(),
    operationAllergies: yesNoEnum.optional(),
})

const medicalHistory = z.object({
    diabetes: yesNoEnum.optional(),
    recurrentUti: yesNoEnum.optional(),
    cardiacProblem: yesNoEnum.optional(),
    hemoglobinopathy: yesNoEnum.optional(),
    endocrineDysfunction: yesNoEnum.optional(),
    anemia: yesNoEnum.optional(),
    hepatitis: yesNoEnum.optional(),
    hypertension: yesNoEnum.optional(),
})

const medicalHistoryEmr = z.object({
    personalDetails: personalDetails.optional(),
    husbandDetails: husbandDetails.optional(),
    medicalHistory: medicalHistory.optional(),
    surgicalHistory: surgicalHistory.optional(),
    additionalInfo: z.string().optional(),
})

export { medicalHistoryEmr }
