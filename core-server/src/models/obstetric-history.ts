import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const obsHistory = pgTable('obs_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  // For single child
  childAge: text('child_age'), // Age of the child - "Bache ki umer kiya hai?"
  childGender: text('child_gender'), // Gender of the child (male/female) - "Larka hai ya larki?"
  fullTermBirth: text('full_term_birth'), // Whether child was born full term - "Poore dino per paida hoa tha?"
  birthPlace: text('birth_place'), // Place where child was born - "Kahan per paida hua tha?/ delivery kahan pe hoyi thi"
  birthMethod: text('birth_method'), // Normal delivery or operation - "Normal hua tha? Operation se hua tha?"
  contractions: text('contractions'), // Natural contractions or induced - "Dardien khudi lagi thi ya lagwani pari thi?"
  birthDuration: text('birth_duration'), // Duration of birth process - "Kitna waqt laga bache ki padaish mein?"
  operationReason: text('operation_reason'), // Reason for operation if applicable - "Kis wajah se hua tha?"
  birthWeight: text('birth_weight'), // Weight of child at birth - "Padaish ke waqt bache ka wazan kitna tha?"
  postDeliveryProblems: text('post_delivery_problems'), // Problems after delivery - "Padaish ke baad apko ya bache ko masla tou nahi hoa?"
  childHealthStatus: text('child_health_status'), // Current health status of child - "Bacha ab theek hai?"
  childSchoolStatus: text('child_school_status'), // Whether child goes to school - "School jata hai?"
  pregnancyProblems: text('pregnancy_problems'), // Problems during pregnancy - "Kya is huml mein sugar, blood pressure ya khoon ka masla hoa? Ya koi aur masla jo aap batana chahein?"

  // For multiple children
  childrenAges: text('children_ages'), // Ages of all children - "Bare bache ki umer kiya hai? Aapke baaqi bachon ki umrein kya hain?"
  childrenGenders: text('children_genders'), // Genders of all children - "Aapke bachon mein se kitne larkay hain aur kitni larkiyan?"
  childrenBirthPlaces: text('children_birth_places'), // Birth places of all children - "Aapke bachay kahan paida huay thay? Delivery kis jaga hui thi?"
  childrenBirthMethods: text('children_birth_methods'), // Birth methods of all children - "Kya sab bachay normal tareeqe se paida huay thay ya kisi ka operation hoa tha?"
  childrenContractions: text('children_contractions'), // Contractions for normal deliveries - "Jin bachon ki normal delivery hui thi, kya un mein dardien khud lag gayi thi ya lagwani pari thi?"
  childrenBirthDurations: text('children_birth_durations'), // Birth durations for all children - "Bachon ki paidaish mein kitna waqt laga tha?"
  childrenOperationReasons: text('children_operation_reasons'), // Operation reasons for cesarean deliveries - "Operation ki wajah kya thi?"
  childrenBirthWeights: text('children_birth_weights'), // Birth weights of all children - "Bachon ki paidaish ke waqt wazan kitna tha?"
  childrenHealthStatus: text('children_health_status'), // Health status of all children - "Kya aapke tamam bachay ab theek hain?"
  childrenSchoolStatus: text('children_school_status'), // School status of all children - "Kya sab school jatay hain?"

  gravidaPara: text('gravida_para'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
