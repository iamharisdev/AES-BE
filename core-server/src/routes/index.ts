import addPatientInfoRoute from '@/routes/add-patient-info'
import diagnosticGenerationRoute from '@/routes/diagnostics-generation'
import emrGenerationRoute from '@/routes/emr-generation'
import exampleRoute from '@/routes/example'
import generatePresignedUrls from '@/routes/generate-presigned-urls'
import getDiagnosticRoute from '@/routes/get-diagnostics'
import getDoctorInfoRoute from '@/routes/get-doctor-info'
import getEmrDetailsRoute from '@/routes/get-emr-details'
import getPatientInfoRoute from '@/routes/get-patient-info'
import getRedFlagsRoute from '@/routes/get-redflags'
import homeRoute from '@/routes/home-page'
import listEmrDetailsRoute from '@/routes/list-emr-details'
import getPatientsInfoRoute from '@/routes/list-patients-info'
import loginDoctorRoute from '@/routes/login-doctor'
import patchEmrRoute from '@/routes/patch-emr-details'
import redFlagsGenerationRoute from '@/routes/redflags-generation'
import registerDoctorRoute from '@/routes/register-doctor'

export const registerRoutes = () => {
	// hacky way to call the scripts and registering the routes
	exampleRoute.getRoutingPath()
	homeRoute.getRoutingPath()
	loginDoctorRoute.getRoutingPath()
	registerDoctorRoute.getRoutingPath()
	generatePresignedUrls.getRoutingPath()
	emrGenerationRoute.getRoutingPath()
	getEmrDetailsRoute.getRoutingPath()
	listEmrDetailsRoute.getRoutingPath()
	addPatientInfoRoute.getRoutingPath()
	getPatientInfoRoute.getRoutingPath()
	getPatientsInfoRoute.getRoutingPath()
	diagnosticGenerationRoute.getRoutingPath()
	getDiagnosticRoute.getRoutingPath()
	redFlagsGenerationRoute.getRoutingPath()
	getRedFlagsRoute.getRoutingPath()
	patchEmrRoute.getRoutingPath()
	getDoctorInfoRoute.getRoutingPath()
}
