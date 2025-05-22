import { createRoute, z } from '@hono/zod-openapi';

export const YesNoEnum = z.enum(['Yes', 'No', "I don't know"]);

export const BirthMethodEnum = z.enum(['Normal', 'Operation', "I don't know"]);

export const BloodGroupEnum = z.enum([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  "I don't know"
]);

export const FamilyTypeEnum = z.enum([
  'Nuclear',
  'Joint',
  'Extended',
  "I don't know"
]);

export const ChildGenderEnum = z.enum([
  'Female',
  'Male',
  'Intersex',
  'Prefer not to say',
  "I don't know"
]);

export const PatientProfileDataSchema = z
  .object({
    name: z.string().nullable(),
    age: z.number().nullable(),
    occupation: z.string().nullable(),
    location: z.string().nullable(),
    married_years: z.number().nullable(),
    cnic: z.string().nullable(),
    education: z.string().nullable(),
    pregnancy_months: z.number().nullable(),
    last_menstruation: z.string().nullable(),
    regular_menstruation: YesNoEnum.optional().nullable(),
    miscarriage: YesNoEnum.optional().nullable(),
    first_pregnancy: YesNoEnum.optional().nullable(),
    family_marriage: YesNoEnum.optional().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('PatientProfile');

export const PresentingComplaintDataSchema = z
  .object({
    patient_problem: z.string().nullable(),
    patient_problem_detailed: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('PresentingComplaint');

export const CurrentPregnancyDataSchema = z
  .object({
    preg_how: z.string().nullable(),
    preg_consent: YesNoEnum.optional().nullable(),
    preg_finding: z.string().nullable(),
    urine_test: YesNoEnum.optional().nullable(),
    ultrasound: YesNoEnum.optional().nullable(),
    folic_acid: YesNoEnum.optional().nullable(),
    blood_urine_test: YesNoEnum.optional().nullable(),
    blood_urine_test_types: z.string().nullable(),
    early_preg_problems: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('CurrentPregnancy');

export const TrimesterDataSchema = z
  .object({
    fetalMovement: z.string().optional(),
    fetalHeartRate: z.number().optional(),
    fundalHeight: z.number().optional(),
    presentation: z.string().optional()
  })
  .openapi('Trimester');

export const GynecologicalHistoryDataSchema = z
  .object({
    family_planning: YesNoEnum.optional().nullable(),
    family_planning_method: z.string().nullable(),
    pap_smear_test: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('GynecologicalHistory');

export const MedicalHistoryDataSchema = z
  .object({
    current_meds: z.string().nullable(),
    sugar_blood_pressure: z.string().nullable(),
    additional_info: z.string().nullable(),
    diabetes: z.string().optional(),
    hypertension: z.string().optional(),
    heartDisease: z.string().optional(),
    asthma: z.string().optional(),
    thyroid: z.string().optional(),
    other: z.string().optional()
  })
  .openapi('MedicalHistory');

export const SurgicalHistoryDataSchema = z
  .object({
    past_surgeries: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('SurgicalHistory');

export const FamilyHistoryDataSchema = z
  .object({
    family_medical_conditions: z.string().nullable(),
    twins_family_history: YesNoEnum.optional().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('FamilyHistory');

export const PersonalHistoryDataSchema = z
  .object({
    allergy_status: YesNoEnum.optional().nullable(),
    allergy_type: z.string().nullable(),
    // blood_group: BloodGroupEnum.nullable(),
    current_weight: z.number().nullable(),
    substance_use: YesNoEnum.optional().nullable(),
    marital_status: z.string().nullable(),
    sleep_and_hunger: z.string().nullable(),
    diet: z.string().nullable(),
    domestic_abuse: YesNoEnum.optional().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('PersonalHistory');

export const SocioEconomicHistoryDataSchema = z
  .object({
    no_family_members: z.number().nullable(),
    // family_type: FamilyTypeEnum.nullable(),
    living_situation: z.string().nullable(),
    more_info: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('SocioEconomicHistory');

export const PreviousPregnancyDataSchema = z.object({
  child_age: z.string().nullable(),
  // child_gender: ChildGenderEnum.nullable(),
  full_term_birth: YesNoEnum.optional().nullable(),
  // birth_method: BirthMethodEnum.nullable(),
  birth_place: z.string().nullable(),
  contractions: YesNoEnum.optional().nullable(),
  duration_birth: z.string().nullable(),
  operation_reason: z.string().nullable(),
  post_delivery_problems: z.string().nullable(),
  child_condition: z.string().nullable(),
  pregnancy_problems: z.string().nullable(),
  additional_info: z.string().nullable()
});

export const PreviousPregnancySchema = z
  .object({
    pregnancies: z.array(PreviousPregnancyDataSchema).nullable()
  })
  .openapi('PreviousPregnancy');

export const EMR = z
  .object({
    patientProfile: PatientProfileDataSchema.optional().nullable(),
    presentingComplaint: PresentingComplaintDataSchema.optional().nullable(),
    currentPregnancy: CurrentPregnancyDataSchema.optional().nullable(),
    trimester: TrimesterDataSchema.optional().nullable(),
    gynecologicalHistory: GynecologicalHistoryDataSchema.optional().nullable(),
    medicalHistory: MedicalHistoryDataSchema.optional().nullable(),
    surgicalHistory: SurgicalHistoryDataSchema.optional().nullable(),
    familyHistory: FamilyHistoryDataSchema.optional().nullable(),
    personalHistory: PersonalHistoryDataSchema.optional().nullable(),
    socioEconomicHistory: SocioEconomicHistoryDataSchema.optional().nullable(),
    previousPregnancy: PreviousPregnancySchema.optional().nullable()
  })
  .openapi('EMR');

