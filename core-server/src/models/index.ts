import { doctorTable } from './doctor'
import { emrRecordTable } from './emr'
import { PatientInfoTable } from './patient-info'

export const schema = {
	doctor: doctorTable,
	emr: emrRecordTable,
	patient: {
		info: PatientInfoTable,
		// TODO: need to add auth table as well later on for patients to authenticate later on just like doctors
	},
}
