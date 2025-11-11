import { db } from '@/db'
import { tables } from '@/models'
import { describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import api from './test-client'

// write all the test cases here
describe('example test case', () => {
	it('should check example test', async () => {
		const typedResponse = await api.example[':id'].$patch({
			param: { id: '123' },
			// query: {}, // add query params like this if needed
			json: {
				name: '',
				age: 12,
			},
		}, {
			// add auth header here if applicable
			headers: {},
		})
		if (typedResponse.status === 200) {
			// would be typed as { message: string }
			const typedJson = await typedResponse.json()
			const schema = z.object({ message: z.string() })
			const valid = schema.safeParse(typedJson)
			expect(valid.success, 'A clear Message indicating that the Success Schema was not valid').toBe(true)
		} else if (typedResponse.status === 400) {
			// do the same, this time it would be typed according to 404 { error: string, ok: boolean }
		} else {
			// handle for any non typed edge cases like 500, 422 if applicable
		}

		// do db clean up like this to avoid chunking up db records
		await db
			.delete(tables.patient.info)
			.where(
				eq(tables.patient.info.phoneNumber, 'the phone number that needs to be cleaned'),
			)
	})
})
