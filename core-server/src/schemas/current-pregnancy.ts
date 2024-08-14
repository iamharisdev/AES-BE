import { z } from 'zod'
import { presentationEnum, yesNoEnum, generalFoodIntakeEnum } from './enums'

const currentPregnancyEmr = z.object({
    heightSymphysisPubis: z.union([z.number(), z.literal('Not provided')]).optional(),
    presentation: z.array(presentationEnum).optional(),
    engagement: yesNoEnum.optional(),
    fetalMovement: yesNoEnum.optional(),
    edema: yesNoEnum.optional(),
    burningMicturition: yesNoEnum.optional(),
    pvDischarge: yesNoEnum.optional(),
    itchingInVaginalArea: yesNoEnum.optional(),
    nausea: yesNoEnum.optional(),
    vomiting: yesNoEnum.optional(),
    diarrhea: yesNoEnum.optional(),
    constipation: yesNoEnum.optional(),
    contractions: yesNoEnum.optional(),
    leakageOfFluidPerVagina: yesNoEnum.optional(),
    vaginalBleeding: yesNoEnum.optional(),
    anyWarningYesNos: z.string().optional(),
    generalFoodIntake: generalFoodIntakeEnum.optional(),
    additionalInfo: z.string().optional(),
})

export { currentPregnancyEmr }
