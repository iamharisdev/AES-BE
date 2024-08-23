import { db } from '@/db'
import { env } from '@/env'
import { table } from '@/models'
import { deleteFile } from '@/services/storage'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'
import api from './test-client'

const TEST_DOCTOR_PHONE_MAIN = '03007171717'
const TEST_DOCTOR_PHONE2 = '03007171719'
const TEST_AUDIO_FILE_EXTENSION = 'wav'
const TEST_PATIENT_PHONE = '03001234567'
const TEST_AUDIO_FILE = './tests/sample.wav'

const sampleFile = Bun.file(TEST_AUDIO_FILE)

const handleNonSuccessResponse = async (
	name: string,
	response: Response,
) => {
	const body = await response.clone().text()
	expect(true, `${name} -> Status: ${response.status}, ${response.statusText}, Body: ${body}`).toBe(false)
}

describe('API Tests', () => {
	let authToken: string

	beforeAll(async () => {
		// Register a doctor to get an auth token
		const registerResponse = await api.doctor.register.$post({
			json: {
				name: 'Test Doctor',
				phoneNumber: TEST_DOCTOR_PHONE_MAIN,
				password: 'password',
				maternityHomeName: 'Test Home',
			},
		})

		if (registerResponse.status !== 200) {
			expect(true, 'unable to register doctor').toBe(false)
			return
		}

		const registerJson = await registerResponse.json()
		authToken = registerJson.token
	})

	afterAll(async () => {
		// Clean up the database
		await db.delete(table.doctor).where(eq(table.doctor.phone, TEST_DOCTOR_PHONE_MAIN))
		await db.delete(table.emr).where(eq(table.emr.patientId, TEST_PATIENT_PHONE))
		await db.delete(table.patient.info).where(eq(table.patient.info.phoneNumber, TEST_PATIENT_PHONE))
	})

	describe('Emr Generation Flow', () => {
		let fileId: string
		it('should perform the entire flow end-to-end', async () => {
			// Add patient info
			const patientResponse = await api.patient.info.$post({
				json: {
					name: 'Test Patient',
					phoneNumber: TEST_PATIENT_PHONE,
					location: 'Test Location',
				},
			}, {
				headers: {
					'Authorization': `Bearer ${authToken}`,
				},
			})

			if (patientResponse.status !== 200) {
				await handleNonSuccessResponse('unable to add patient info', patientResponse)
				return
			}

			const patientJson = await patientResponse.json()
			expect(patientJson).toHaveProperty('message', 'Patient Record Created')
			console.log('Patient Record Created')

			// Generate presigned URLs
			const presignedUrlResponse = await api.storage['generate-urls'].$post({
				query: {
					extension: TEST_AUDIO_FILE_EXTENSION,
				},
			}, {
				headers: {
					'Authorization': `Bearer ${authToken}`,
				},
			})

			if (presignedUrlResponse.status !== 200) {
				await handleNonSuccessResponse('unable to generate presigned URLs', presignedUrlResponse)
				return
			}

			const presignedUrlJson = await presignedUrlResponse.json()
			expect(presignedUrlJson).toHaveProperty('fileId')
			expect(presignedUrlJson).toHaveProperty('uploadUrl')
			expect(presignedUrlJson).toHaveProperty('downloadUrl')
			console.log('Presigned Url Generated')

			fileId = presignedUrlJson.fileId

			// Upload the audio file to the presigned URL
			const uploadResponse = await fetch(presignedUrlJson.uploadUrl, {
				method: 'PUT',
				body: sampleFile,
			})

			if (uploadResponse.status !== 200) {
				await handleNonSuccessResponse('unable to upload audio file', uploadResponse)
				return
			}
			console.log('File Uploaded')

			// Generate EMR
			const emrResponse = await api.emr.generate.$post({
				json: {
					fileID: fileId,
					patientPhoneNumber: TEST_PATIENT_PHONE,
					useMini: true,
				},
			}, {
				headers: {
					'Authorization': `Bearer ${authToken}`,
				},
			})

			if (emrResponse.status !== 200) {
				await handleNonSuccessResponse('unable to generate EMR', emrResponse)
				return
			}

			const emrJson = await emrResponse.json()
			expect(emrJson).toHaveProperty('emrId')
			expect(emrJson).toHaveProperty('content')
			console.log('EMR Generated')

			const emrId = emrJson.emrId

			// Get EMR details
			const emrDetailsResponse = await api.emr.id[':emrId'].$get({
				param: { emrId },
			}, {
				headers: {
					'Authorization': `Bearer ${authToken}`,
				},
			})

			if (emrDetailsResponse.status !== 200) {
				await handleNonSuccessResponse('unable to get emr details', emrDetailsResponse)
				return
			}

			const emrDetailsJson = await emrDetailsResponse.json()
			expect(emrDetailsJson).toHaveProperty('emrId', emrId)
			expect(emrDetailsJson).toHaveProperty('content')

			// List EMRs
			const listEmrResponse = await api.emr.$get({
				query: {
					patientId: TEST_PATIENT_PHONE,
				},
			}, {
				headers: {
					'Authorization': `Bearer ${authToken}`,
				},
			})

			if (listEmrResponse.status !== 200) {
				await handleNonSuccessResponse('unable to list EMRs', listEmrResponse)
				return
			}

			const listEmrJson = await listEmrResponse.json()
			expect(Array.isArray(listEmrJson)).toBe(true)
		})

		afterAll(async () => {
			if (fileId) {
				await deleteFile({ bucket: env.UPLOAD_BUCKET, key: fileId })
			}
		})
	})

	it('should get home page', async () => {
		const response = await api.index.$get()
		expect(response.status).toBe(200)
	})

	it('should register a doctor', async () => {
		const response = await api.doctor.register.$post({
			json: {
				name: 'Test Doctor 2',
				phoneNumber: TEST_DOCTOR_PHONE2,
				password: 'password',
				maternityHomeName: 'Test Home 2',
			},
		})
		const json = await response.json()
		expect(response.status).toBe(200)
		expect(json).toHaveProperty('message', 'Account Created')

		// Cleanup
		await db.delete(table.doctor).where(eq(table.doctor.phone, TEST_DOCTOR_PHONE2))
	})

	it('should login a doctor', async () => {
		const response = await api.doctor.login.$post({
			json: {
				phoneNumber: TEST_DOCTOR_PHONE_MAIN,
				password: 'password',
			},
		})
		const json = await response.json()
		expect(response.status).toBe(200)
		expect(json).toHaveProperty('message', 'Login Successful')
		expect(json).toHaveProperty('token')
	})
})
