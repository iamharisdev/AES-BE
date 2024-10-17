import app from '@/app'
import { db } from '@/db'
import { jwtMiddleware } from '@/middleware/jwt'
import { table } from '@/models'
import { createRoute, z } from '@hono/zod-openapi'
import { eq, inArray } from 'drizzle-orm'

const PatientInfoSchema = z.object({
	name: z.string().openapi({
		example: 'Ali',
	}),
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	location: z.string().openapi({
		example: '45 A, Society, Main Road, Karachi',
	}),
})

const SuccessResponseSchema = z.object({
	name: z.string().openapi({
		example: 'Nazia',
	}),
	phoneNumber: z.string().openapi({
		example: '03001234567',
	}),
	maternityHomeName: z.string().openapi({
		example: 'Zacha Bacha Clinic',
	}),
	patients: z.array(PatientInfoSchema).openapi({
		example: [
			{
				name: 'Ali',
				phoneNumber: '03001234567',
				location: '45 A, Society, Main Road, Karachi',
			},
		],
	}),
})

const NotFoundSchema = z.object({
	error: z.string(),
})

const route = createRoute({
	method: 'get',
	operationId: 'getDoctorsPatients',
	tags: ['Doctor'],
	path: '/doctor/patients',
	summary: 'Fetch Details of all patients for a particular Health Practitioner',
	security: [{ jwt: [] }],
	middleware: [jwtMiddleware],

	responses: {
		200: {
			content: {
				'application/json': {
					schema: SuccessResponseSchema,
				},
			},
			description: 'Patients details fetched successfully',
		},
		404: {
			content: {
				'application/json': {
					schema: NotFoundSchema,
				},
			},
			description: 'Doctor or Patients not found',
		},
		403: {
			content: {
				'application/json': {
					schema: NotFoundSchema,
				},
			},
			description: 'Unauthorized',
		},
	},
})

const handler = app.openapi(route, async (c) => {
	const { userType, phoneNumber } = c.get('jwtPayload')

	if (userType === 'patient') {
		return c.json({ error: `Unauthorized. Only doctors can fetch patient information.` }, 403)
	}
    // Could have done a join here to get the patient details directly but that can become costly with larger datasets + lesser control on errors
    
	const doctor = await db
		.select()
		.from(table.doctor)
		.where(eq(table.doctor.phone, phoneNumber))
		.execute()
		.then(res => res.at(0))

	if (!doctor) {
		return c.json({ error: `Doctor with phone number ${phoneNumber} not found.` }, 404)
	}

	const emrRecords = await db
		.selectDistinct({ patientId: table.emr.patientId })
		.from(table.emr)
		.where(eq(table.emr.doctorId, doctor.phone))
		.execute()

	if (emrRecords.length === 0) {
		return c.json({ error: `No patients found for doctor with phone number ${phoneNumber}.` }, 404)
	}

	const patientIds = emrRecords.map(record => record.patientId)

	const patientDetails = await db
		.select()
		.from(table.patient.info)
		.where(inArray(table.patient.info.phoneNumber, patientIds))
		.execute()

	if (patientDetails.length === 0) {
		return c.json({ error: `No patient details found for the given doctor.` }, 404)
	}

	return c.json({
		phoneNumber: doctor.phone,
		name: doctor.name,
		maternityHomeName: doctor.maternityHomeName,
		patients: patientDetails,
	}, 200)
})

export type GetDoctorsPatientsInfoRoute = typeof handler

export default route
