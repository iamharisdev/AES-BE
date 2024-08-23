import { z } from 'zod'
import { familyTypeEnum, livingSituationEnum, optionalNumber, relationshipQualityEnum, yesNoEnum } from './enums'

export const socioEconomicHistoryEmrSchema = z.object({
	noOfFamilyMembers: optionalNumber,
	familyType: familyTypeEnum,
	livingSituation: livingSituationEnum,
	relationshipWithFamilyHusband: relationshipQualityEnum,
	historyOfDomesticAbuse: yesNoEnum,
	mentalHealthIssues: yesNoEnum,
	additionalInformation: z.string().optional(),
})
