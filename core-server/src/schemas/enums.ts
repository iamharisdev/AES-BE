import { z } from 'zod'

// Enums
const presentationEnum = z.enum(['Cephalic', 'Breech', 'Transverse', 'Longitudinal']);
const edemaEnum = z.enum(['Not provided', 'Mild', 'Moderate', 'Severe']);
const yesNoEnum = z.enum(['Not provided', 'Yes', 'No']);
const generalFoodIntakeEnum = z.enum(['Not provided', 'Healthy', 'Unhealthy']);
const durationOfLaborEnum = z.enum(['Less than 12 hours', 'Greater than 12 hours', 'Not Provided']);
const modeOfDeliveryEnum = z.enum([
    'Emergency Cesarean Section',
    'Elective Cesarean Section',
    'Miscarriage',
    'Termination',
    'Normal/Vaginal Delivery',
    'Not Provided',
]);
const healthStatusEnum = z.enum(['Alive and healthy', 'Alive but sick', 'Deceased', 'Not Provided']);
const sexEnum = z.enum(['Female', 'Male', 'Intersex', 'Not Provided']);
const familyTypeEnum = z.enum(['Joint', 'Nuclear']);
const livingSituationEnum = z.enum(['Husband out of country', 'Living with patient']);
const relationshipQualityEnum = z.enum(['Good', 'Average', 'Poor']);
const bloodGroupEnum = z.enum([
    'A positive',
    'O positive',
    'B positive',
    'AB positive',
    'A negative',
    'O negative',
    'B negative',
    'AB negative',
]);
const educationEnum = z.enum(['High School', 'Bachelors', 'Masters', 'PhD', 'Other']);
const occupationEnum = z.enum(['Housewife', 'Private job', 'Government job', 'Business', 'Unemployed', 'Student']);
const nmcEnum = z.enum(['Regular', 'Irregular']);

export {
    presentationEnum,
    edemaEnum,
    yesNoEnum,
    generalFoodIntakeEnum,
    durationOfLaborEnum,
    modeOfDeliveryEnum,
    healthStatusEnum,
    sexEnum,
    familyTypeEnum,
    livingSituationEnum,
    relationshipQualityEnum,
    bloodGroupEnum,
    educationEnum,
    occupationEnum,
    nmcEnum,
};
