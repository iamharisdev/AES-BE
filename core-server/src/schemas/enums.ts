import { z } from 'zod'

// Enums
export const presentationEnum = z.enum(['Cephalic', 'Breech', 'Transverse', 'Longitudinal', 'N/A']).openapi('')
export const edemaEnum = z.enum(['Mild', 'Moderate', 'Severe', 'N/A'])
export const yesNoEnum = z.enum(['Yes', 'No', 'N/A'])
export const generalFoodIntakeEnum = z.enum(['Healthy', 'Unhealthy', 'N/A'])
export const durationOfLaborEnum = z.enum(['Less than 12 hours', 'Greater than 12 hours', 'N/A'])
export const modeOfDeliveryEnum = z.enum([
	'Emergency Cesarean Section',
	'Elective Cesarean Section',
	'Miscarriage',
	'Termination',
	'Normal/Vaginal Delivery',
	'N/A',
])
export const healthStatusEnum = z.enum(['Alive and healthy', 'Alive but sick', 'Deceased', 'N/A'])
export const sexEnum = z.enum(['Female', 'Male', 'Intersex', 'N/A'])
export const familyTypeEnum = z.enum(['Joint', 'Nuclear', 'N/A'])
export const livingSituationEnum = z.enum(['Husband out of country', 'Living with patient', 'N/A'])
export const relationshipQualityEnum = z.enum(['Good', 'Average', 'Poor', 'N/A'])
export const bloodGroupEnum = z.enum([
	'A positive',
	'O positive',
	'B positive',
	'AB positive',
	'A negative',
	'O negative',
	'B negative',
	'AB negative',
	'N/A',
])
export const educationEnum = z.enum(['High School', 'Bachelors', 'Masters', 'PhD', 'Other', 'N/A'])
export const occupationEnum = z.enum([
	'Housewife',
	'Private job',
	'Government job',
	'Business',
	'Unemployed',
	'Student',
	'N/A',
])
export const nmcEnum = z.enum(['Regular', 'Irregular', 'N/A'])

export const optionalNumber = z.union([z.number(), z.literal('N/A')])
