import { z } from 'zod'
import { generalFoodIntakeEnum, optionalNumber, presentationEnum, yesNoEnum } from './enums'

export const currentPregnancyEmrSchema = z.object({
	heightSymphysisPubis: optionalNumber,
	fetal_presentation: z.array(presentationEnum),
	fetal_engagement: yesNoEnum,
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
	anyWarnings: z.string().optional(),
	generalFoodIntake: generalFoodIntakeEnum,
	additionalInfo: z.string().optional(),
})
