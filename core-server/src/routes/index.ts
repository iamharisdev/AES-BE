import exampleRoute from '@/routes/example'
import homeRoute from '@/routes/home-page'
import loginDoctorRoute from '@/routes/login-doctor'
import registerDoctorRoute from '@/routes/register-doctor'

export const registerRoutes = () => {
    exampleRoute.getRoutingPath()
    homeRoute.getRoutingPath()
    registerDoctorRoute.getRoutingPath()
}
