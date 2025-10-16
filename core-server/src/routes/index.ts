import homeRoute from "@/routes/home-page";
import {
  getExaminationHandler,
  createExaminationHandler,
  updateExaminationHandler,
} from "@/routes/examination";
import {
  createHospitalHandler,
  listHospitalsHandler,
  getHospitalByIdHandler,
  updateHospitalHandler,
  deleteHospitalHandler,
} from "@/routes/hospital";
import {
  editPatientHandler,
  getPatientInfoHandler,
  searchPatientsHandler,
  uploadVoiceNoteHandler,
} from "@/routes/patient";
import {
  getAllEmrsFromPhoneHandler,
  getAllEmrsFromCnicHandler,
  getEmrDetailsHandler,
  updateEmrHandler,
} from "@/routes/emr";
import {
  createPresentingComplaintHandler,
  getPresentingComplaintHandler,
  updatePresentingComplaintHandler,
  deletePresentingComplaintHandler,
} from "@/routes/presenting-complaint";
import {
  createTrimesterHandler,
  getTrimesterHandler,
  updateTrimesterHandler,
  deleteTrimesterHandler,
} from "@/routes/trimester";
import {
  createCurrentPregnancyHandler,
  getCurrentPregnancyHandler,
  updateCurrentPregnancyHandler,
  deleteCurrentPregnancyHandler,
} from "@/routes/current-pregnancy";
import {
  createObstetricHistoryHandler,
  getObstetricHistoryHandler,
  updateObstetricHistoryHandler,
  deleteObstetricHistoryHandler,
} from "@/routes/obstetric-history";
import {
  createGynecologicalHistoryHandler,
  getGynecologicalHistoryHandler,
  updateGynecologicalHistoryHandler,
  deleteGynecologicalHistoryHandler,
} from "@/routes/gynecological-history";
import {
  createSurgicalHistoryHandler,
  getSurgicalHistoryHandler,
  updateSurgicalHistoryHandler,
  deleteSurgicalHistoryHandler,
} from "@/routes/surgical-history";
import {
  createFamilyHistoryHandler,
  getFamilyHistoryHandler,
  updateFamilyHistoryHandler,
  deleteFamilyHistoryHandler,
} from "@/routes/family-history";
import {
  createPersonalHistoryHandler,
  getPersonalHistoryHandler,
  updatePersonalHistoryHandler,
  deletePersonalHistoryHandler,
} from "@/routes/personal-history";
import {
  createSocioEconomicHistoryHandler,
  getSocioEconomicHistoryHandler,
  updateSocioEconomicHistoryHandler,
  deleteSocioEconomicHistoryHandler,
} from "@/routes/socio-economic-history";
import {
  createVitalsHandler,
  listVitalsHandler,
  getVitalsByIdHandler,
  updateVitalsHandler,
  deleteVitalsHandler,
} from "@/routes/vitals";
import {
  createFollowupQuestionsHandler,
  getFollowupQuestionsHandler,
  updateFollowupQuestionsHandler,
  deleteFollowupQuestionsHandler,
} from "@/routes/followup-questions";
import {
  createFilesHandler,
  getFilesHandler,
  updateFilesHandler,
  deleteFilesHandler,
} from "@/routes/files";
import generatePresignedUrls from "@/routes/generate-presigned-urls";
import {
  createProposedPlanHandler,
  getProposedPlansByEmrHandler,
  getProposedPlanByIdHandler,
  updateProposedPlanHandler,
  deleteProposedPlanHandler,
} from "@/routes/proposed-plan";
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
import {
  createRedFlagsHandler,
  listRedFlagsHandler,
  getRedFlagsByIdHandler,
  updateRedFlagsHandler,
  deleteRedFlagsHandler,
  getMajorRedFlags,
} from "@/routes/red-flags";
import {
  createDiagnosticsHandler,
  getDiagnosticsByEmrHandler,
  updateDiagnosticsHandler,
  deleteDiagnosticsHandler,
} from "@/routes/diagnostics";
import {
  createMedicalHistoryHandler,
  getMedicalHistoryByEmrHandler,
  updateMedicalHistoryHandler,
  deleteMedicalHistoryHandler,
} from "@/routes/medical-history";
import {
  createQRCodeHandler,
  getQRCodeByTokenHandler,
  getQRCodeByPatientHandler,
  updateQRCodeHandler,
  deleteQRCodeHandler,
} from "@/routes/qr-code";
import {
  createVisitHandler,
  getAdvisedTestsHandler,
  getAllVisitsHandler,
  getVisitDetailsHandler,
} from "@/routes/visits";
import {
  listPatientChatsHandler,
  getPatientChatByIdHandler,
  createPatientChatHandler,
  updatePatientChatHandler,
  deletePatientChatHandler,
  addMessageToChatHandler
} from '@/routes/patient-chats';

import { audioToTextHandler } from "./audio-to-text";

export const registerRoutes = () => {
  homeRoute.getRoutingPath();
  generatePresignedUrls.getRoutingPath();
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
  listVitalsHandler();
  getVitalsByIdHandler();
  updateVitalsHandler();
  deleteVitalsHandler();
  createFollowupQuestionsHandler();
  getFollowupQuestionsHandler();
  updateFollowupQuestionsHandler();
  deleteFollowupQuestionsHandler();
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
  searchPatientsHandler();
  getPatientInfoHandler();
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
};
