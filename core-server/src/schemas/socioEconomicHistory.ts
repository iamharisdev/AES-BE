import { z } from 'zod'
import { familyTypeEnum, livingSituationEnum, relationshipQualityEnum, yesNoEnum } from './enums'

const socioEconomicHistory = z.object({
    noOfFamilyMembers: z.union([z.number(), yesNoEnum]).optional(),
    familyType: familyTypeEnum.optional(),
    livingSituation: livingSituationEnum.optional(),
    relationshipWithFamilyHusband: relationshipQualityEnum.optional(),
    historyOfDomesticAbuse: yesNoEnum.optional(),
    mentalHealthIssues: yesNoEnum.optional(),
    additionalInformation: z.string().optional(),
})

export { socioEconomicHistory }
