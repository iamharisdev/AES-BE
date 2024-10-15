import { z } from 'zod'

// Enums with 'N/A' mapped to null using .nullable()
export const presentationEnum = z.enum(['Cephalic', 'Breech', 'Transverse', 'Longitudinal']).nullable()
export const edemaEnum = z.enum(['Mild', 'Moderate', 'Severe']).nullable()
export const yesNoEnum = z.enum(['Yes', 'No']).nullable()
export const generalFoodIntakeEnum = z.enum(['Healthy', 'Unhealthy']).nullable()
export const durationOfLaborEnum = z.enum(['Less than 12 hours', 'Greater than 12 hours']).nullable()
export const modeOfDeliveryEnum = z.enum([
	'Emergency Cesarean Section',
	'Elective Cesarean Section',
	'Miscarriage',
	'Termination',
	'Normal/Vaginal Delivery',
]).nullable()
export const healthStatusEnum = z.enum(['Alive and healthy', 'Alive but sick', 'Deceased']).nullable()
export const sexEnum = z.enum(['Female', 'Male', 'Intersex']).nullable()
export const familyTypeEnum = z.enum(['Joint', 'Nuclear']).nullable()
export const livingSituationEnum = z.enum(['Husband out of country', 'Living with patient']).nullable()
export const relationshipQualityEnum = z.enum(['Good', 'Average', 'Poor']).nullable()
export const bloodGroupEnum = z.enum([
	'A positive',
	'O positive',
	'B positive',
	'AB positive',
	'A negative',
	'O negative',
	'B negative',
	'AB negative',
]).nullable()
export const educationEnum = z.enum(['High School', 'Bachelors', 'Masters', 'PhD', 'Other']).nullable()
export const occupationEnum = z.enum([
	'Housewife',
	'Private job',
	'Government job',
	'Business',
	'Unemployed',
	'Student',
]).nullable()
export const nmcEnum = z.enum(['Regular', 'Irregular']).nullable()

// Optional number with .nullable() applied
export const optionalNumber = z.number().nullable()
