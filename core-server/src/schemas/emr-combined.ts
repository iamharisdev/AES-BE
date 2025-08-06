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
    miscarriage: YesNoEnum.optional().nullable(),
    first_pregnancy: YesNoEnum.optional().nullable(),
    family_marriage: YesNoEnum.optional().nullable(),
    husband_phone_number: z.string().nullable(),
    patient_blood_group: BloodGroupEnum.optional().nullable(),
    husband_blood_group: BloodGroupEnum.optional().nullable(),
    last_menstruation_date: z.string().nullable(),
    total_pregnancies: z.string().nullable(),
    miscarriages: z.string().nullable(),
    miscarriage_timing: z.string().nullable(),
    stillbirths: z.string().nullable(),
    neonatal_deaths: z.string().nullable(),
    living_children: z.string().nullable(),
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
    preg_method: z.string().nullable(),
    preg_finding: z.string().nullable(),
    urine_test: YesNoEnum.optional().nullable(),
    ultrasound: YesNoEnum.optional().nullable(),
    folic_acid: YesNoEnum.optional().nullable(),
    blood_urine_test: YesNoEnum.optional().nullable(),
    blood_urine_test_types: z.string().nullable(),
    early_pregnancy_symptoms: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('CurrentPregnancy');

export const TrimesterDataSchema = z
  .object({
    fetusMovement: z.string().optional(),
    movementReduction: z.string().optional(),
    ultrasound: z.string().optional(),
    recentScan: z.string().optional(),
    scanResults: z.string().optional(),
    checkupRegularity: z.string().optional(),
    bloodUrineTests: z.string().optional(),
    hbLevel: z.string().optional(),
    hbSymptoms: z.string().optional(),
    sugarTest: z.string().optional(),
    sugarTestResult: z.string().optional(),
    sugarMedication: z.string().optional(),
    bloodPressure: z.string().optional(),
    bloodPressureResult: z.string().optional(),
    bpMedication: z.string().optional(),
    strengthMeds: z.string().optional(),
    pregnancySymptoms: z.string().optional(),
    additionalInfo: z.string().optional()
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

export const SurgicalHistoryDataSchema = z
  .object({
    surgical_history: z.string().nullable()
  })
  .openapi('SurgicalHistory');

export const MedicalHistoryDataSchema = z
  .object({
    current_medications: z.string().nullable(),
    medical_conditions: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('MedicalHistory');

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
    substance_use: YesNoEnum.optional().nullable(),
    relationship_domestic_situation: z.string().nullable(),
    sleep_issues: z.string().nullable(),
    hunger_issues: z.string().nullable(),
    diet: z.string().nullable()
  })
  .openapi('PersonalHistory');

export const SocioEconomicHistoryDataSchema = z
  .object({
    no_family_members: z.number().nullable(),
    financial_situation: z.string().nullable(),
    living_situation: z.string().nullable(),
    additional_info: z.string().nullable()
  })
  .openapi('SocioEconomicHistory');

export const PreviousPregnancyDataSchema = z.object({
  child_age: z.string().nullable(),
  child_gender: ChildGenderEnum.optional().nullable(),
  full_term_birth: YesNoEnum.optional().nullable(),
  birth_place: z.string().nullable(),
  birth_method: BirthMethodEnum.optional().nullable(),
  contractions: YesNoEnum.optional().nullable(),
  duration_birth: z.string().nullable(),
  operation_reason: z.string().nullable(),
  birth_weight: z.string().nullable(),
  post_delivery_problems: z.string().nullable(),
  child_condition: z.string().nullable(),
  child_school_status: z.string().nullable(),
  pregnancy_problems: z.string().nullable(),
  additional_info: z.string().nullable()
});

export const PreviousPregnancySchema = z
  .object({
    pregnancies: z.array(PreviousPregnancyDataSchema).nullable()
  })
  .openapi('PreviousPregnancy');

export const ObstetricHistoryDataSchema = z
  .object({
    // Single child fields
    child_age: z.string().nullable(),
    child_gender: ChildGenderEnum.optional().nullable(),
    full_term_birth: YesNoEnum.optional().nullable(),
    birth_place: z.string().nullable(),
    birth_method: BirthMethodEnum.optional().nullable(),
    contractions: YesNoEnum.optional().nullable(),
    duration_birth: z.string().nullable(),
    operation_reason: z.string().nullable(),
    birth_weight: z.string().nullable(),
    post_delivery_problems: z.string().nullable(),
    child_condition: z.string().nullable(),
    child_school_status: z.string().nullable(),
    pregnancy_problems: z.string().nullable(),

    // Multiple children fields (as text)
    children_ages: z.string().nullable(),
    children_genders: z.string().nullable(),
    children_birth_places: z.string().nullable(),
    children_birth_methods: z.string().nullable(),
    children_contractions: z.string().nullable(),
    children_birth_durations: z.string().nullable(),
    children_operation_reasons: z.string().nullable(),
    children_birth_weights: z.string().nullable(),
    children_conditions: z.string().nullable(),
    children_school_status: z.string().nullable(),

    // Pregnancy outcomes
    total_pregnancies: z.string().nullable(),
    miscarriages: z.string().nullable(),
    miscarriage_timing: z.string().nullable(),
    stillbirths: z.string().nullable(),
    neonatal_deaths: z.string().nullable(),
    living_children: z.string().nullable(),

    additional_info: z.string().nullable()
  })
  .openapi('ObstetricHistory');

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
    obstetricHistory: ObstetricHistoryDataSchema.optional().nullable(),
    previousPregnancy: PreviousPregnancySchema.optional().nullable()
  })
  .openapi('EMR');
