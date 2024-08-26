import addPatientInfoRoute from '@/routes/add-patient-info'
import diagnosticGenerationRoute from '@/routes/diagnostics-generation'
import emrGenerationRoute from '@/routes/emr-generation'
import exampleRoute from '@/routes/example'
import generatePresignedUrls from '@/routes/generate-presigned-urls'
import getEmrDetailsRoute from '@/routes/get-emr-details'
import getPatientInfoRoute from '@/routes/get-patient-info'
import homeRoute from '@/routes/home-page'
import listEmrDetailsRoute from '@/routes/list-emr-details'
import loginDoctorRoute from '@/routes/login-doctor'
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
	diagnosticGenerationRoute.getRoutingPath()
}
