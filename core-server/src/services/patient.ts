import { db } from '@/db'
import { tables } from '@/models'
import { eq } from 'drizzle-orm'

export const getPatientInfo = async ({ phoneNumber }: { phoneNumber: string }) => {
	return db
		.select()
		.from(tables.patient)
		.where(
			eq(tables.patient.phoneNumber, phoneNumber),
		)
		.execute()
		.then(res => res.at(0))
}
