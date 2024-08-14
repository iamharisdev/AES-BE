import { z } from 'zod'
import { familyTypeEnum, livingSituationEnum, relationshipQualityEnum, yesNoEnum } from './enums'

export const socioEconomicHistoryEmrSchema = z.object({
    noOfFamilyMembers: z.union([z.number(), yesNoEnum]),
    familyType: familyTypeEnum,
    livingSituation: livingSituationEnum,
    relationshipWithFamilyHusband: relationshipQualityEnum,
    historyOfDomesticAbuse: yesNoEnum,
    mentalHealthIssues: yesNoEnum,
    additionalInformation: z.string(),
})
