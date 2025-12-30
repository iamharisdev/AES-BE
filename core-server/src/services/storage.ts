import { env } from '@/env'
import { Storage } from '@google-cloud/storage'
import path from 'path'
import fs from 'fs'

// Build absolute path to credentials file
const credentialsPath = env.KEYFILE_PATH
	? path.resolve(process.cwd(), env.KEYFILE_PATH)
	: path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS || "")

let storage

// ✅ Use credentials file if it exists, otherwise fallback to default
if (fs.existsSync(credentialsPath)) {
	storage = new Storage({ keyFilename: credentialsPath })
	console.info(`🧩 Using GCS credentials from: ${credentialsPath}`)
} else {
	storage = new Storage()
	console.info("☁️ Using default GCS credentials (Cloud Run)")
}

export const createPresignedPutUrl = async ({ bucket, key }: { bucket: string; key: string }) => {
	return storage
		.bucket(bucket)
		.file(key)
		.getSignedUrl({
			version: 'v4',
			action: 'write',
			expires: Date.now() + 3600 * 1000, // 1 hour
		})
		.then((urls) => urls[0])
}

export const createPresignedGetUrl = async ({ bucket, key }: { bucket: string; key: string }) => {
	return storage
		.bucket(bucket)
		.file(key)
		.getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + 3600 * 1000, // 1 hour
		})
		.then((urls) => urls[0])
}

export const doesFileExists = async ({ bucket, key }: { bucket: string; key: string }) => {
	// in case of any error we are going to assume that the file does not exists
	// this handles the edge case where try to access a bucket that we do not have permission to
	return storage
		.bucket(bucket)
		.file(key)
		.exists()
		.then((arr) => arr[0])
		.catch(() => false)
}

export const deleteFile = async ({ bucket, key }: { bucket: string; key: string }) => {
	return storage
		.bucket(bucket)
		.file(key)
		.delete({ ignoreNotFound: true })
		.then(res => res[0].statusCode < 400)
}
