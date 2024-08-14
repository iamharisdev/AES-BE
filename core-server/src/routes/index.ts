import emrGenerationRoute from '@/routes/emr-generation'
import exampleRoute from '@/routes/example'
import generatePresignedUrls from '@/routes/generate-presigned-urls'
import homeRoute from '@/routes/home-page'
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
}
