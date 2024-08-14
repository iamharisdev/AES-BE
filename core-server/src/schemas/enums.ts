import { z } from 'zod'

// Enums
export const presentationEnum = z.enum(['Cephalic', 'Breech', 'Transverse', 'Longitudinal'])
export const edemaEnum = z.enum(['Not provided', 'Mild', 'Moderate', 'Severe'])
export const yesNoEnum = z.enum(['Not provided', 'Yes', 'No'])
export const generalFoodIntakeEnum = z.enum(['Not provided', 'Healthy', 'Unhealthy'])
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
export const familyTypeEnum = z.enum(['Joint', 'Nuclear'])
export const livingSituationEnum = z.enum(['Husband out of country', 'Living with patient'])
export const relationshipQualityEnum = z.enum(['Good', 'Average', 'Poor'])
export const bloodGroupEnum = z.enum([
    'A positive',
    'O positive',
    'B positive',
    'AB positive',
    'A negative',
    'O negative',
    'B negative',
    'AB negative',
])
export const educationEnum = z.enum(['High School', 'Bachelors', 'Masters', 'PhD', 'Other'])
export const occupationEnum = z.enum([
    'Housewife',
    'Private job',
    'Government job',
    'Business',
    'Unemployed',
    'Student',
])
export const nmcEnum = z.enum(['Regular', 'Irregular'])
