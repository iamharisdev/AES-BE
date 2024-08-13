import { z } from 'zod';
import { yesNoEnum, durationOfLaborEnum, modeOfDeliveryEnum, sexEnum, healthStatusEnum } from './enums';

const pregnancyDetails = z.object({
    yearOfBirth: z.union([z.number(), yesNoEnum]).optional(),
    placeOfBirth: z.union([z.string(), yesNoEnum]).optional(),
    spotInducedLabor: yesNoEnum.optional(),
    durationOfLabor: durationOfLaborEnum.optional(),
    modeOfDelivery: modeOfDeliveryEnum.optional(),
    maturityInWeeks: z.union([z.number(), yesNoEnum]).optional(),
    postnatalComplications: yesNoEnum.optional(),
    puerperium: yesNoEnum.optional(),
    cerclage: yesNoEnum.optional(),
    pih: yesNoEnum.optional(),
    fetalAnomaly: yesNoEnum.optional(),
    rhIncompatibility: yesNoEnum.optional(),
    weightOfBaby: z.union([z.number(), yesNoEnum]).optional(),
    ageOfBaby: z.union([z.number(), yesNoEnum]).optional(),
    sexOfBaby: sexEnum.optional(),
    currentHealthStatusOfBaby: healthStatusEnum.optional(),
    additionalInfo: z.string().optional(),
});

const previousPregnancyEmr = z.object({
    pregnancies: z.array(pregnancyDetails),
});

export { previousPregnancyEmr };
