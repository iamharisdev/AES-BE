import { z } from 'zod'
import { yesNoEnum } from './enums'

const patientFamilyHistory = z.object({
    diabetes_in_patients_family: yesNoEnum,
    hypertension_in_patients_family: yesNoEnum,
    multiplePregnancy_in_patients_family: yesNoEnum,
    haemoglobinopathiesTb_in_patients_family: yesNoEnum,
    congenitalAnomalies_in_patients_family: yesNoEnum,
})

const husbandFamilyHistory = z.object({
    diabetes_in_husbands_family: yesNoEnum,
    hypertension_in_husbands_family: yesNoEnum,
    multiplePregnancy_in_husbands_family: yesNoEnum,
    haemoglobinopathiesTb_in_husbands_family: yesNoEnum,
    congenitalAnomalies_in_husbands_family: yesNoEnum,
})

export const familyHistoryEmrSchema = z.object({
    patientFamilyHistory: patientFamilyHistory,
    husbandFamilyHistory: husbandFamilyHistory,
    additionalInfo: z.string().optional(),
})
