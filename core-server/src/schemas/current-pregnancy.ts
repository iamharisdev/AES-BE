import { z } from 'zod'
import { presentationEnum, yesNoEnum, generalFoodIntakeEnum } from './enums'

export const currentPregnancyEmrSchema = z.object({
    heightSymphysisPubis: z.union([z.number(), z.literal('Not provided')]),
    presentation: z.array(presentationEnum),
    engagement: yesNoEnum,
    fetalMovement: yesNoEnum,
    edema: yesNoEnum,
    burningMicturition: yesNoEnum,
    pvDischarge: yesNoEnum,
    itchingInVaginalArea: yesNoEnum,
    nausea: yesNoEnum,
    vomiting: yesNoEnum,
    diarrhea: yesNoEnum,
    constipation: yesNoEnum,
    contractions: yesNoEnum,
    leakageOfFluidPerVagina: yesNoEnum,
    vaginalBleeding: yesNoEnum,
    anyWarningYesNos: z.string(),
    generalFoodIntake: generalFoodIntakeEnum,
    additionalInfo: z.string(),
})
