import { z } from 'zod'

// Enums
const presentationEnum = z
    .enum(['Cephalic', 'Breech', 'Transverse', 'Longitudinal'])
    .describe('Fetal presentation (e.g., Cephalic, Breech, Transverse)')
const edemaEnum = z
    .enum(['Not provided', 'Mild', 'Moderate', 'Severe'])
    .describe('Presence of edema (swelling) (e.g., Mild, Moderate, Severe)')
const yesNoEnum = z.enum(['Not provided', 'Yes', 'No']).describe('Yes or No information')
const generalFoodIntakeEnum = z
    .enum(['Not provided', 'Healthy', 'Unhealthy'])
    .describe('Overall quality and quantity of food intake (e.g., Healthy, Unhealthy)')
const durationOfLaborEnum = z
    .enum(['Less than 12 hours', 'Greater than 12 hours', 'Not Provided'])
    .describe('Duration of labor')
const modeOfDeliveryEnum = z
    .enum([
        'Emergency Cesarean Section',
        'Elective Cesarean Section',
        'Miscarriage',
        'Termination',
        'Normal/Vaginal Delivery',
        'Not Provided',
    ])
    .describe('Mode of delivery')
const healthStatusEnum = z
    .enum(['Alive and healthy', 'Alive but sick', 'Deceased', 'Not Provided'])
    .describe('Current health status of the baby')
const sexEnum = z.enum(['Female', 'Male', 'Intersex', 'Not Provided']).describe('Sex of the baby')
const familyTypeEnum = z.enum(['Joint', 'Nuclear']).describe('Joint or Nuclear family')
const livingSituationEnum = z
    .enum(['Husband out of country', 'Living with patient'])
    .describe('Husband out of country or living with patient')
const relationshipQualityEnum = z
    .enum(['Good', 'Average', 'Poor'])
    .describe("Quality of Patient's Relationship with family and husband")
const bloodGroupEnum = z
    .enum([
        'A positive',
        'O positive',
        'B positive',
        'AB positive',
        'A negative',
        'O negative',
        'B negative',
        'AB negative',
    ])
    .describe('Blood group')
const educationEnum = z.enum(['High School', 'Bachelors', 'Masters', 'PhD', 'Other']).describe('Education level')
const occupationEnum = z
    .enum(['Housewife', 'Private job', 'Government job', 'Business', 'Unemployed', 'Student'])
    .describe('Occupation')
const nmcEnum = z.enum(['Regular', 'Irregular']).describe('Normal menstrual cycle duration')

// Schemas
const currentPregnancyEmr = z.object({
    heightSymphysisPubis: z
        .union([z.number(), z.literal('Not provided')])
        .optional()
        .describe('Height of the symphysis pubis measured in centimeters'),
    presentation: z
        .array(presentationEnum)
        .optional()
        .describe('Fetal presentation (e.g., Cephalic, Breech, Transverse)'),
    engagement: yesNoEnum.optional().describe('Fetal head engagement in the pelvis (e.g., Yes, No)'),
    fetalMovement: yesNoEnum.optional().describe('Observation of fetal movements (e.g., Yes, No)'),
    edema: yesNoEnum.optional().describe('Presence of edema (swelling) (e.g., Yes, No)'),
    burningMicturition: yesNoEnum
        .optional()
        .describe(
            'Presence of burning sensation during urination (e.g., Yes, No). Consider low to mean No and high to mean Yes.'
        ),
    pvDischarge: yesNoEnum
        .optional()
        .describe(
            'Presence and nature of per vaginam (PV) discharge (e.g., Yes, No). Consider low to mean No and high to mean Yes.'
        ),
    itchingInVaginalArea: yesNoEnum
        .optional()
        .describe(
            'Experience of itching in the vaginal area (e.g., Yes, No). Consider low to mean No and high to mean Yes.'
        ),
    nausea: yesNoEnum
        .optional()
        .describe('Experience of nausea (e.g., Yes, No). Consider low to mean No and high to mean Yes.'),
    vomiting: yesNoEnum
        .optional()
        .describe('Experience of vomiting (e.g., Yes, No). Consider low to mean No and high to mean Yes.'),
    diarrhea: yesNoEnum
        .optional()
        .describe('Experience of diarrhea (e.g., Yes, No). Consider low to mean No and high to mean Yes.'),
    constipation: yesNoEnum
        .optional()
        .describe('Experience of constipation (e.g., Yes, No). Consider low to mean No and high to mean Yes.'),
    contractions: yesNoEnum
        .optional()
        .describe('Presence of uterine contractions (e.g., Yes, No). Consider low to mean No and high to mean Yes.'),
    leakageOfFluidPerVagina: yesNoEnum
        .optional()
        .describe(
            'Experience of fluid leakage from the vagina (e.g., Yes, No). Consider low to mean No and high to mean Yes.'
        ),
    vaginalBleeding: yesNoEnum
        .optional()
        .describe('Presence vaginal bleeding (e.g., Yes, No). Consider low to mean No and high to mean Yes.'),
    anyWarningYesNos: z
        .string()
        .optional()
        .describe('Any warning yesNos observed (e.g., severe headache, visual disturbances)'),
    generalFoodIntake: generalFoodIntakeEnum
        .optional()
        .describe('Overall quality and quantity of food intake (e.g., Healthy, Unhealthy)'),
    additionalInfo: z
        .string()
        .optional()
        .describe('Any data about the patient not captured in the other designated fields should be included here'),
})

const pregnancyDetails = z.object({
    yearOfBirth: z.union([z.number(), yesNoEnum]).optional().describe('Year of birth'),
    placeOfBirth: z.union([z.string(), yesNoEnum]).optional().describe('Place of birth'),
    spotInducedLabor: yesNoEnum.optional().describe('Spot induced labor'),
    durationOfLabor: durationOfLaborEnum.optional().describe('Duration of labor'),
    modeOfDelivery: modeOfDeliveryEnum.optional().describe('Mode of delivery'),
    maturityInWeeks: z.union([z.number(), yesNoEnum]).optional().describe('Maturity in weeks'),
    postnatalComplications: yesNoEnum.optional().describe('Presence of Postnatal complications (III & IV stage)'),
    puerperium: yesNoEnum.optional().describe('Presence of Puerperium (e.g., depression, DVT, sepsis)'),
    cerclage: yesNoEnum.optional().describe('Presence of Cerclage'),
    pih: yesNoEnum.optional().describe('Presence of Pregnancy induced hypertension (PIH)'),
    fetalAnomaly: yesNoEnum.optional().describe('Presence of Fetal anomaly'),
    rhIncompatibility: yesNoEnum.optional().describe('Presence of Rh incompatibility'),
    weightOfBaby: z.union([z.number(), yesNoEnum]).optional().describe('Weight of the baby in kilograms'),
    ageOfBaby: z.union([z.number(), yesNoEnum]).optional().describe('Age of the baby in years'),
    sexOfBaby: sexEnum.optional().describe('Sex of the baby'),
    currentHealthStatusOfBaby: healthStatusEnum.optional().describe('Current health status of the baby'),
    additionalInfo: z
        .string()
        .optional()
        .describe('Any data about the pregnancy not captured in the other designated fields should be included here'),
})

const previousPregnancyEmr = z.object({
    pregnancies: z.array(pregnancyDetails).describe('List of previous pregnancies'),
})

const patientFamilyHistory = z.object({
    diabetes: yesNoEnum.optional().describe("Presence of Diabetes in patient's family"),
    hypertension: yesNoEnum.optional().describe("Presence of Hypertension in patient's family"),
    multiplePregnancy: yesNoEnum.optional().describe("Presence of Multiple pregnancies in patient's family"),
    haemoglobinopathiesTb: yesNoEnum.optional().describe("Presence of Haemoglobinopathies or TB in patient's family"),
    congenitalAnomalies: yesNoEnum.optional().describe("Presence of Congenital anomalies in patient's family"),
})

const husbandFamilyHistory = z.object({
    diabetes: yesNoEnum.optional().describe("Presence of Diabetes in husband's family"),
    hypertension: yesNoEnum.optional().describe("Presence of Hypertension in husband's family"),
    multiplePregnancy: yesNoEnum.optional().describe("Presence of Multiple pregnancies in husband's family"),
    haemoglobinopathiesTb: yesNoEnum.optional().describe("Presence of Haemoglobinopathies or TB in husband's family"),
    congenitalAnomalies: yesNoEnum.optional().describe("Presence of Congenital anomalies in husband's family"),
})

const familyHistoryEmr = z.object({
    patientFamilyHistory: patientFamilyHistory.optional(),
    husbandFamilyHistory: husbandFamilyHistory.optional(),
    additionalInfo: z
        .string()
        .optional()
        .describe(
            "Any data about the patient's family or patient's husband's family not captured in the other designated fields should be included here"
        ),
})

const socioEconomicHistory = z.object({
    noOfFamilyMembers: z.union([z.number(), yesNoEnum]).optional().describe('Number of family members'),
    familyType: familyTypeEnum.optional().describe('Joint or Nuclear family'),
    livingSituation: livingSituationEnum.optional().describe('Husband out of country or living with patient'),
    relationshipWithFamilyHusband: relationshipQualityEnum
        .optional()
        .describe("Quality of Patient's Relationship with family and husband"),
    historyOfDomesticAbuse: yesNoEnum.optional().describe('History of domestic abuse'),
    mentalHealthIssues: yesNoEnum.optional().describe('Mental health issues'),
    additionalInformation: z.string().optional().describe('Additional information'),
})

const personalDetails = z.object({
    bloodGroupSelf: bloodGroupEnum.optional().describe('Blood group of the patient'),
    educationSelf: educationEnum.optional().describe('Education level of the patient'),
    occupationSelf: occupationEnum.optional().describe('Occupation of the patient'),
    marriedSince: z
        .union([z.number(), yesNoEnum])
        .optional()
        .describe(
            'Duration of marriage in years. Convert duration in months to duration in years. If not married, assign 0.'
        ),
    gravida: z.union([z.number(), yesNoEnum]).optional().describe('Gravida status'),
    para: z.union([z.number(), yesNoEnum]).optional().describe('Para status'),
    miscarriage: z.union([z.number(), yesNoEnum]).optional().describe('Number of miscarriages'),
    abortion: z.union([z.number(), yesNoEnum]).optional().describe('Number of abortions'),
    nmc: nmcEnum
        .optional()
        .describe(
            "Normal menstrual cycle duration. If normal, regular or 7/28, assign 'Regular'. If not normal or irregular, assign 'Irregular'"
        ),
    consanguinousMarriage: yesNoEnum.optional().describe('Consanguineous marriage status'),
    vaginalBleedingSinceLastPeriod: yesNoEnum.optional().describe('Presence of vaginal bleeding since last period'),
    contraceptives: yesNoEnum.optional().describe('Usage of oral or other contraceptives'),
    smokingHistory: yesNoEnum.optional().describe('History of smoking'),
    drugHistory: yesNoEnum.optional().describe('History of drug use'),
    presentMedication: z.string().optional().describe('Any medications currently being taken by the patient'),
})

const husbandDetails = z.object({
    name: z.string().optional().describe('Name of the husband'),
    age: z.string().optional().describe('Age of the husband'),
    education: educationEnum.optional().describe('Education level of the husband'),
    bloodGroup: bloodGroupEnum.optional().describe('Blood group of the husband'),
    occupation: occupationEnum.optional().describe('Occupation of the husband'),
})

const medicalHistory = z.object({
    diabetes: yesNoEnum.optional().describe('Diabetes status'),
    recurrentUti: yesNoEnum.optional().describe('Recurrent UTI status'),
    cardiacProblem: yesNoEnum.optional().describe('Cardiac problem status'),
    hemoglobinopathy: yesNoEnum.optional().describe('Hemoglobinopathy status'),
    endocrineDysfunction: yesNoEnum.optional().describe('Endocrine dysfunction (Thyroid/PCOS) status'),
    anemia: yesNoEnum.optional().describe('Anemia status'),
    hepatitis: yesNoEnum.optional().describe('Hepatitis status'),
    hypertension: yesNoEnum.optional().describe('Hypertension status'),
})

const surgicalHistory = z.object({
    bloodTransfusion: yesNoEnum.optional().describe('History of blood transfusion'),
    infertility: yesNoEnum.optional().describe('Infertility status'),
    anestheticProblem: yesNoEnum.optional().describe('Anesthetic problem status'),
    operationAllergies: yesNoEnum.optional().describe('Operation allergies status'),
})

const medicalHistoryEmr = z.object({
    personalDetails: personalDetails.optional(),
    husbandDetails: husbandDetails.optional(),
    medicalHistory: medicalHistory.optional(),
    surgicalHistory: surgicalHistory.optional(),
    additionalInfo: z
        .string()
        .optional()
        .describe('Any data about the patient not captured in the other designated fields should be included here'),
})

const emrSchema = z.object({
    currentPregnancy: currentPregnancyEmr,
    previousPregnancy: previousPregnancyEmr,
    familyHistory: familyHistoryEmr,
    socioEconomicHistory,
    medicalHistory: medicalHistoryEmr,
})

export {
    currentPregnancyEmr,
    previousPregnancyEmr,
    patientFamilyHistory,
    husbandFamilyHistory,
    familyHistoryEmr,
    socioEconomicHistory,
    personalDetails,
    husbandDetails,
    medicalHistory,
    surgicalHistory,
    medicalHistoryEmr,
}
