import { db } from '@/db'
import { table } from '@/models'
import { eq } from 'drizzle-orm'

export const getPatientInfo = async ({ phoneNumber }: { phoneNumber: string }) => {
	return db
		.select()
		.from(table.patient.info)
		.where(
			eq(table.patient.info.phone, phoneNumber),
		)
		.execute()
		.then(res => res.at(0))
}
