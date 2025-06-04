import  { generatePresignedUrlsHandler } from '@/routes/generate-presigned-urls';
import  { getEmrRoute } from '@/routes/get-emr-details';
import homeRoute from '@/routes/home-page';
import { registerLoginDoctorRoute } from '@/routes/login-doctor';
import  { RegisterDoctorRoute } from '@/routes/register-doctor';
import  { searchPatients } from '@/routes/search-patients';
import { getMajorRedFlags } from './get-major-redflags';
import { patchEmrRoute } from './patch-emr-details';
import { getPatientInfoRoute } from './get-patient-info';
import { getRedFlagsRoute } from './get-redflags';
import { getDoctorInfoRoute } from './get-doctor-info';
import { getAllEmrsFromPhone } from './get-erms-from-phone';
import { updateEmr } from './update-emr';
import { getExaminationDetailsRoute } from './get-examination-details';
import { updateExaminationDetailsRoute } from './update-examination-details';
import { createExaminationDetailsRoute } from './create-examination-details';
import { uploadVoiceNoteRoute } from './upload-voice-note';
import { getDoctorsRoute } from './get-doctors';



export const registerRoutes = () => {


 registerLoginDoctorRoute();
 getMajorRedFlags();
 searchPatients();
 RegisterDoctorRoute();
 generatePresignedUrlsHandler()
 getEmrRoute();
 getPatientInfoRoute();
 getRedFlagsRoute();
 patchEmrRoute()
 getDoctorInfoRoute();
 getAllEmrsFromPhone();
 updateEmr();
 getExaminationDetailsRoute();
 updateExaminationDetailsRoute();
 createExaminationDetailsRoute();
 uploadVoiceNoteRoute();
 getDoctorsRoute();
homeRoute.getRoutingPath();


};
