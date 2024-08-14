import { z } from 'zod'
import { yesNoEnum } from './enums'

const patientFamilyHistory = z.object({
    diabetes: yesNoEnum,
    hypertension: yesNoEnum,
    multiplePregnancy: yesNoEnum,
    haemoglobinopathiesTb: yesNoEnum,
    congenitalAnomalies: yesNoEnum,
})

const husbandFamilyHistory = z.object({
    diabetes: yesNoEnum,
    hypertension: yesNoEnum,
    multiplePregnancy: yesNoEnum,
    haemoglobinopathiesTb: yesNoEnum,
    congenitalAnomalies: yesNoEnum,
})

export const familyHistoryEmrSchema = z.object({
    patientFamilyHistory: patientFamilyHistory,
    husbandFamilyHistory: husbandFamilyHistory,
    additionalInfo: z.string(),
})
