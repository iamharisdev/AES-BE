import { z } from 'zod'

// Enums
export const presentationEnum = z.enum(['Cephalic', 'Breech', 'Transverse', 'Longitudinal', 'Not Provided',])
export const edemaEnum = z.enum(['Not provided', 'Mild', 'Moderate', 'Severe', 'Not Provided',])
export const yesNoEnum = z.enum(['Not provided', 'Yes', 'No', 'Not Provided',])
export const generalFoodIntakeEnum = z.enum(['Not provided', 'Healthy', 'Unhealthy', 'Not Provided',])
export const durationOfLaborEnum = z.enum(['Less than 12 hours', 'Greater than 12 hours', 'Not Provided'])
export const modeOfDeliveryEnum = z.enum([
    'Emergency Cesarean Section',
    'Elective Cesarean Section',
    'Miscarriage',
    'Termination',
    'Normal/Vaginal Delivery',
    'Not Provided',
])
export const healthStatusEnum = z.enum(['Alive and healthy', 'Alive but sick', 'Deceased', 'Not Provided'])
export const sexEnum = z.enum(['Female', 'Male', 'Intersex', 'Not Provided'])
export const familyTypeEnum = z.enum(['Joint', 'Nuclear', 'Not Provided'])
export const livingSituationEnum = z.enum(['Husband out of country', 'Living with patient', 'Not Provided'])
export const relationshipQualityEnum = z.enum(['Good', 'Average', 'Poor', 'Not Provided'])
export const bloodGroupEnum = z.enum([
    'A positive',
    'O positive',
    'B positive',
    'AB positive',
    'A negative',
    'O negative',
    'B negative',
    'AB negative',
    'Not Provided',
])
export const educationEnum = z.enum(['High School', 'Bachelors', 'Masters', 'PhD', 'Other', 'Not Provided',])
export const occupationEnum = z.enum([
    'Housewife',
    'Private job',
    'Government job',
    'Business',
    'Unemployed',
    'Student',
    'Not Provided',
])
export const nmcEnum = z.enum(['Regular', 'Irregular', 'Not Provided',])
