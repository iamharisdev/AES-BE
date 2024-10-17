import { type AddPatientInfoRoute } from '@/routes/add-patient-info'
import { type DiagnosticsGenerationRoute } from '@/routes/diagnostics-generation'
import { type EmrGenerationRoute } from '@/routes/emr-generation'
import { type ExampleRoute } from '@/routes/example'
import { type GeneratePresignedUrlsRoute } from '@/routes/generate-presigned-urls'
import { type GetDiagnosticsRoute } from '@/routes/get-diagnostics'
import { type GetEmrRoute } from '@/routes/get-emr-details'
import { type GetPatientInfoRoute } from '@/routes/get-patient-info'
import { type GetRedFlagsRoute } from '@/routes/get-redflags'
import { type HomeRoute } from '@/routes/home-page'
import { type ListEmrsRoute } from '@/routes/list-emr-details'
import { type LoginDoctorRoute } from '@/routes/login-doctor'
import { type PatchEmrRoute } from '@/routes/patch-emr-details'
import { type RedFlagsGenerationRoute } from '@/routes/redflags-generation'
import { type RegisterDoctorRoute } from '@/routes/register-doctor'
import { type GetDoctorsPatientsInfoRoute } from '@/routes/get-doctors-patients'
import { hc } from 'hono/client'

const PORT = process.env.PORT || '8000'
const URL = `http://127.0.0.1:${PORT}`

type Routes =
	| ExampleRoute
	| AddPatientInfoRoute
	| GetPatientInfoRoute
	| RegisterDoctorRoute
	| LoginDoctorRoute
	| GetEmrRoute
	| GeneratePresignedUrlsRoute
	| EmrGenerationRoute
	| HomeRoute
	| ListEmrsRoute
	| DiagnosticsGenerationRoute
	| GetDiagnosticsRoute
	| RedFlagsGenerationRoute
	| GetRedFlagsRoute
	| PatchEmrRoute
	| GetDoctorsPatientsInfoRoute

// Constructing a Type Safe Hono Client
const client = hc<Routes>(URL)
export default client
