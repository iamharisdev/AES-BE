import exampleRoute from '@/routes/example'
import homeRoute from '@/routes/home-page'
import loginDoctorRoute from '@/routes/login-doctor'
import registerDoctorRoute from '@/routes/register-doctor'
import generatePresignedUrls from '@/routes/generate-presigned-urls'
import emrGenerationRoute from '@/routes/emr-generation'

export const registerRoutes = () => {
    // hacky way to call the scripts and registering the routes
    exampleRoute.getRoutingPath()
    homeRoute.getRoutingPath()
    loginDoctorRoute.getRoutingPath()
    registerDoctorRoute.getRoutingPath()
    generatePresignedUrls.getRoutingPath()
    emrGenerationRoute.getRoutingPath()
}
