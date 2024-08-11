import { Storage } from '@google-cloud/storage'

const storage = new Storage({ keyFilename: process.env.KEYFILE_PATH })

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
