import { env } from '@/env'
import { Storage } from '@google-cloud/storage'

const storage = new Storage({ keyFilename: env.KEYFILE_PATH })

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
