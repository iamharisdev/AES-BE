import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";
export const obsHistory = pgTable('obs_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),

  // ✅ Matched fields
  childrenBirthMethods: text('children_birth_methods'),
  childrenBirthDetails: text('children_birth_details'),
  oldestChildAge: text('oldest_child_age'),
  childrenAges: text('children_ages'),
  childrenGenders: text('children_genders'),
  childrenFullTerm: text('children_full_term'),
  childrenBirthPlaces: text('children_birth_places'),
  childrenBirthWeights: text('children_birth_weights'),
  childrenHealthStatus: text('children_health_status'),
  previousPregnancyConditions: text('previous_pregnancy_conditions'),
  previousPregnancycomplications: text('previous_pregnancy_complications'),

  //   Add new field
  //pastPregnancyConditions: text("past_pregnancy_conditions"),

  // ⚠️ Legacy / Extra fields (kept for compatibility)

  // singleChildDeliveryType: text("single_child_delivery_type"),
  // singleChildContractions: text("single_child_contractions"),
  // singleChildBirthDuration: text("single_child_birth_duration"),
  // singleChildOperationReason: text("single_child_operation_reason"),
  // multipleChildrenDeliveryTypes: text("multiple_children_delivery_types"),
  // multipleChildrenDetails: text("multiple_children_details"),
  // childAge: text("child_age"),
  // childGender: text("child_gender"),
  // fullTermBirth: text("full_term_birth"),
  // birthPlace: text("birth_place"),
  // birthWeight: text("birth_weight"),
  // postDeliveryProblems: text("post_delivery_problems"),
  // childHealthStatus: text("child_health_status"),
  // childSchoolStatus: text("child_school_status"),
  // birthMethod: text("birth_method"),
  // contractions: text("contractions"),
  // birthDuration: text("birth_duration"),
  // operationReason: text("operation_reason"),
  // pregnancyProblems: text("pregnancy_problems"),
  // childrenContractions: text("children_contractions"),
  // childrenBirthDurations: text("children_birth_durations"),
  // childrenOperationReasons: text("children_operation_reasons"),
  gravidaPara: text("gravida_para"),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
