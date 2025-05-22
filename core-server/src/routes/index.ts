import generatePresignedUrls from '@/routes/generate-presigned-urls';
import getDoctorInfoRoute from '@/routes/get-doctor-info';
import getEmrDetailsRoute from '@/routes/get-emr-details';
import getAllEmrsFromPhone from '@/routes/get-erms-from-phone';
import getExaminationDetailsRoute from '@/routes/get-examination-details';
import getPatientInfoRoute from '@/routes/get-patient-info';
import getRedFlagsRoute from '@/routes/get-redflags';
import homeRoute from '@/routes/home-page';
import { registerLoginDoctorRoute } from '@/routes/login-doctor';

import patchEmrRoute from '@/routes/patch-emr-details';
import registerDoctorRoute from '@/routes/register-doctor';
import searchPatientsRoute from '@/routes/search-patients';
import updateEmr from '@/routes/update-emr';
import updateExaminationDetailsRoute from '@/routes/update-examination-details';
import createExaminationDetailsRoute from '@/routes/create-examination-details';
import uploadVoiceNoteRoute from '@/routes/upload-voice-note';
import GetDoctorsRoute from '@/routes/get-doctors';

export const registerRoutes = () => {
  registerLoginDoctorRoute()
  homeRoute.getRoutingPath();
  registerDoctorRoute.getRoutingPath();
  generatePresignedUrls.getRoutingPath();
  getEmrDetailsRoute.getRoutingPath();
  getPatientInfoRoute.getRoutingPath();
  getRedFlagsRoute.getRoutingPath();
  patchEmrRoute.getRoutingPath();
  getDoctorInfoRoute.getRoutingPath();
  getAllEmrsFromPhone.getRoutingPath();
  searchPatientsRoute.getRoutingPath();
  updateEmr.getRoutingPath();
  getExaminationDetailsRoute.getRoutingPath();
  updateExaminationDetailsRoute.getRoutingPath();
  createExaminationDetailsRoute.getRoutingPath();
  uploadVoiceNoteRoute.getRoutingPath();
  GetDoctorsRoute.getRoutingPath()
};
