import { z } from "zod"
import { yesNoEnum } from "./enums"


const patientFamilyHistory = z.object({
    diabetes: yesNoEnum.optional(),
    hypertension: yesNoEnum.optional(),
    multiplePregnancy: yesNoEnum.optional(),
    haemoglobinopathiesTb: yesNoEnum.optional(),
    congenitalAnomalies: yesNoEnum.optional(),
});

const husbandFamilyHistory = z.object({
    diabetes: yesNoEnum.optional(),
    hypertension: yesNoEnum.optional(),
    multiplePregnancy: yesNoEnum.optional(),
    haemoglobinopathiesTb: yesNoEnum.optional(),
    congenitalAnomalies: yesNoEnum.optional(),
});

const familyHistoryEmr = z.object({
    patientFamilyHistory: patientFamilyHistory.optional(),
    husbandFamilyHistory: husbandFamilyHistory.optional(),
    additionalInfo: z.string().optional(),
});

export { familyHistoryEmr };