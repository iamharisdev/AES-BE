import homeRoute from '@/routes/home-page';
import hospitalRoute from '@/routes/hospital';
import userRoute from '@/routes/user';
import patientRoute from '@/routes/patient';
import examinationRoute from '@/routes/examination';
import redFlagsRoute from '@/routes/red-flags';
import emrRoute from '@/routes/emr';
import generatePresignedUrls from '@/routes/generate-presigned-urls';

export const registerRoutes = () => {
  // hacky way to call the scripts and registering the routes
  homeRoute.getRoutingPath();
  generatePresignedUrls.getRoutingPath();
  emrRoute.getRoutingPath();
  redFlagsRoute.getRoutingPath();
  examinationRoute.getRoutingPath();
  hospitalRoute.getRoutingPath();
  userRoute.getRoutingPath();
  patientRoute.getRoutingPath();
};
