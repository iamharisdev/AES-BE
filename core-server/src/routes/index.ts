import {
  createCurrentPregnancyHandler,
  deleteCurrentPregnancyHandler,
  getCurrentPregnancyHandler,
  updateCurrentPregnancyHandler,
} from "@/routes/current-pregnancy";
import {
  createDiagnosticsHandler,
  deleteDiagnosticsHandler,
  getAllDiagnosticsByPatientHandler,
  getDiagnosticsByEmrHandler,
  updateDiagnosticsHandler,
} from "@/routes/diagnostics";
import {
  createEmrHandler,
  getAllEmrsFromCnicHandler,
  getAllEmrsFromPhoneHandler,
  getEmrDetailsHandler,
  updateEmrDataHandler,
  updateEmrHandler,
} from "@/routes/emr";
import {
  createExaminationHandler,
  getExaminationHandler,
  updateExaminationHandler,
} from "@/routes/examination";
import {
  createFamilyHistoryHandler,
  deleteFamilyHistoryHandler,
  getFamilyHistoryHandler,
  updateFamilyHistoryHandler,
} from "@/routes/family-history";
import {
  createFilesHandler,
  deleteFilesHandler,
  getFilesHandler,
  updateFilesHandler,
  uploadFileHandler,
} from "@/routes/files";
import {
  createFollowupQuestionsHandler,
  deleteFollowupQuestionsHandler,
  getFollowupQuestionsHandler,
  updateFollowupQuestionsHandler,
} from "@/routes/followup-questions";
import {
  createGynecologicalHistoryHandler,
  deleteGynecologicalHistoryHandler,
  getGynecologicalHistoryHandler,
  updateGynecologicalHistoryHandler,
} from "@/routes/gynecological-history";
import {
  createHospitalHandler,
  deleteHospitalHandler,
  getHospitalByIdHandler,
  listHospitalsHandler,
  updateHospitalHandler,
} from "@/routes/hospital";
import {
  createMedicalHistoryHandler,
  deleteMedicalHistoryHandler,
  getMedicalHistoryByEmrHandler,
  updateMedicalHistoryHandler,
} from "@/routes/medical-history";
import {
  createObstetricHistoryHandler,
  deleteObstetricHistoryHandler,
  getObstetricHistoryHandler,
  updateObstetricHistoryHandler,
} from "@/routes/obstetric-history";
import {
  createPatientHandler,
  editPatientHandler,
  getPatientInfoHandler,
  searchPatientsHandler,
  uploadVoiceNoteHandler,
} from "@/routes/patient";
import {
  addMessageToChatHandler,
  createPatientChatHandler,
  deletePatientChatHandler,
  getPatientChatByIdHandler,
  listPatientChatsHandler,
  updatePatientChatHandler,
} from "@/routes/patient-chats";
import {
  createPersonalHistoryHandler,
  deletePersonalHistoryHandler,
  getPersonalHistoryHandler,
  updatePersonalHistoryHandler,
} from "@/routes/personal-history";
import {
  createPresentingComplaintHandler,
  deletePresentingComplaintHandler,
  getPresentingComplaintHandler,
  updatePresentingComplaintHandler,
} from "@/routes/presenting-complaint";
import {
  createProposedPlanHandler,
  deleteProposedPlanHandler,
  getAllDoctorNotesByPatientHandler,
  getProposedPlanByIdHandler,
  getProposedPlansByEmrHandler,
  updateProposedPlanHandler,
} from "@/routes/proposed-plan";
import {
  createQRCodeHandler,
  deleteQRCodeHandler,
  getQRCodeByPatientHandler,
  getQRCodeByTokenHandler,
  updateQRCodeHandler,
} from "@/routes/qr-code";
import {
  createRedFlagsHandler,
  deleteRedFlagsHandler,
  getMajorRedFlags,
  getRedFlagsByIdHandler,
  listRedFlagsHandler,
  updateRedFlagsHandler,
} from "@/routes/red-flags";
import {
  createSocioEconomicHistoryHandler,
  deleteSocioEconomicHistoryHandler,
  getSocioEconomicHistoryHandler,
  updateSocioEconomicHistoryHandler,
} from "@/routes/socio-economic-history";
import {
  createSurgicalHistoryHandler,
  deleteSurgicalHistoryHandler,
  getSurgicalHistoryHandler,
  updateSurgicalHistoryHandler,
} from "@/routes/surgical-history";
import {
  createTrimesterHandler,
  deleteTrimesterHandler,
  getTrimesterHandler,
  updateTrimesterHandler,
} from "@/routes/trimester";
import {
  createVisitHandler,
  getAdvisedTestsHandler,
  getAllVisitsHandler,
  getVisitDetailsHandler,
  updateVisitHandler,
} from "@/routes/visits";
import {
  createVitalsHandler,
  deleteVitalsHandler,
  getVitalsByIdHandler,
  listVitalsHandler,
  updateVitalsHandler,
} from "@/routes/vitals";
import {
  changePasswordHandler,
  forgotPasswordHandler,
  getUserInfoHandler,
  getUsersHandler,
  loginHandler,
  registerHandler,
  sendOtpHandler,
  verifyOtpHandler,
} from "./user";

import { audioToTextHandler } from "./audio-to-text";
import {
  getReachActivationMetricsHandler
} from "./metrics/reachAndActivation";
import { getUserMetricsHandler } from "./user-metrics";
import { getEngagementMetricsHandler } from "./metrics/engagement";
import { getLanguageModalityMetricsHandler } from "./metrics/language";

export const registerRoutes = () => {
  createPresentingComplaintHandler();
  getPresentingComplaintHandler();
  updatePresentingComplaintHandler();
  deletePresentingComplaintHandler();
  createTrimesterHandler();
  getTrimesterHandler();
  updateTrimesterHandler();
  deleteTrimesterHandler();
  createGynecologicalHistoryHandler();
  getGynecologicalHistoryHandler();
  updateGynecologicalHistoryHandler();
  deleteGynecologicalHistoryHandler();
  createSurgicalHistoryHandler();
  getSurgicalHistoryHandler();
  updateSurgicalHistoryHandler();
  deleteSurgicalHistoryHandler();
  createFamilyHistoryHandler();
  getFamilyHistoryHandler();
  updateFamilyHistoryHandler();
  deleteFamilyHistoryHandler();
  createPersonalHistoryHandler();
  getPersonalHistoryHandler();
  updatePersonalHistoryHandler();
  deletePersonalHistoryHandler();
  createSocioEconomicHistoryHandler();
  getSocioEconomicHistoryHandler();
  updateSocioEconomicHistoryHandler();
  deleteSocioEconomicHistoryHandler();
  createVitalsHandler();
  updateVisitHandler();
  listVitalsHandler();
  getVitalsByIdHandler();
  updateVitalsHandler();
  deleteVitalsHandler();
  createFollowupQuestionsHandler();
  getFollowupQuestionsHandler();
  updateFollowupQuestionsHandler();
  deleteFollowupQuestionsHandler();
  uploadFileHandler();
  createFilesHandler();
  getFilesHandler();
  updateFilesHandler();
  deleteFilesHandler();
  getExaminationHandler();
  createExaminationHandler();
  updateExaminationHandler();
  createHospitalHandler();
  listHospitalsHandler();
  getHospitalByIdHandler();
  updateHospitalHandler();
  deleteHospitalHandler();
  createProposedPlanHandler();
  getProposedPlansByEmrHandler();
  getProposedPlanByIdHandler();
  updateProposedPlanHandler();
  deleteProposedPlanHandler();
  getUserInfoHandler();
  getUsersHandler();
  loginHandler();
  registerHandler();
  getEmrDetailsHandler();
  getAllEmrsFromPhoneHandler();
  getAllEmrsFromCnicHandler();
  updateEmrHandler();
  createEmrHandler();
  updateEmrDataHandler();
  createPatientHandler();
  searchPatientsHandler();
  getPatientInfoHandler();
  getAllDoctorNotesByPatientHandler();
  editPatientHandler();
  uploadVoiceNoteHandler();
  createCurrentPregnancyHandler();
  getCurrentPregnancyHandler();
  updateCurrentPregnancyHandler();
  deleteCurrentPregnancyHandler();
  createObstetricHistoryHandler();
  getObstetricHistoryHandler();
  updateObstetricHistoryHandler();
  deleteObstetricHistoryHandler();
  createRedFlagsHandler();
  listRedFlagsHandler();
  getRedFlagsByIdHandler();
  updateRedFlagsHandler();
  deleteRedFlagsHandler();
  getMajorRedFlags();
  changePasswordHandler();
  sendOtpHandler();
  verifyOtpHandler();
  forgotPasswordHandler();
  createDiagnosticsHandler();
  getDiagnosticsByEmrHandler();
  updateDiagnosticsHandler();
  deleteDiagnosticsHandler();
  createMedicalHistoryHandler();
  getMedicalHistoryByEmrHandler();
  updateMedicalHistoryHandler();
  deleteMedicalHistoryHandler();
  createQRCodeHandler();
  getQRCodeByTokenHandler();
  getQRCodeByPatientHandler();
  updateQRCodeHandler();
  deleteQRCodeHandler();
  createVisitHandler();
  getAllVisitsHandler();
  getVisitDetailsHandler();
  getAdvisedTestsHandler();
  audioToTextHandler();
  listPatientChatsHandler();
  getPatientChatByIdHandler();
  createPatientChatHandler();
  updatePatientChatHandler();
  deletePatientChatHandler();
  addMessageToChatHandler();
  getAllDiagnosticsByPatientHandler();
  getUserMetricsHandler();
  //Metrics
  getReachActivationMetricsHandler();
  getEngagementMetricsHandler()
  getLanguageModalityMetricsHandler()
};
