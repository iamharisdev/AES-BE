import app from '@/app';
import { env } from '@/env';
import {
  createPresignedGetUrl,
  createPresignedPutUrl
} from '@/services/storage';
import { createRoute, z } from '@hono/zod-openapi';
import { ulid } from 'ulidx';

// Define the request schema to include the extension
const GeneratePresignedUrlsRequestSchema = z.object({
  extension: z
    .enum(['mp3', 'wav', 'm4a', 'mpeg', 'webm', 'mpga', 'mp4'])
    .openapi({
      example: 'mp3'
    })
});

// Define the response schema
const GeneratePresignedUrlsResponseSchema = z.object({
  fileId: z.string().openapi({
    example: '01F8MECHZX3TBDSZ7XRADM79XE.mp3'
  }),
  uploadUrl: z.string().openapi({
    example:
      'https://storage.googleapis.com/bucket/01F8MECHZX3TBDSZ7XRADM79XE.mp3?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=...'
  }),
  downloadUrl: z.string().openapi({
    example:
      'https://storage.googleapis.com/bucket/01F8MECHZX3TBDSZ7XRADM79XE.mp3?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=...'
  })
});

// Create the route
const route = createRoute({
  method: 'post',
  operationId: 'generatePresignedUrls',
  tags: ['Storage'],
  path: '/storage/generate-urls',
  summary:
    'Generate an ID and provide presigned URLs for uploading and downloading a file. The download URL is used to retrieve the uploaded file.',
  request: {
    query: GeneratePresignedUrlsRequestSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GeneratePresignedUrlsResponseSchema
        }
      },
      description: 'Presigned URLs generated successfully'
    }
  }
});

// Define the handler
export const generatePresignedUrlsHandler =()=>{



app.openapi(route, async c => {
  const { extension } = c.req.valid('query');
  const id = ulid();
  const bucket = env.UPLOAD_BUCKET || 'undefined';
  const key = `${id}.${extension}`;
  const uploadUrl = await createPresignedPutUrl({ bucket, key });
  const downloadUrl = await createPresignedGetUrl({ bucket, key });
  return c.json(
    {
      fileId: key,
      uploadUrl,
      downloadUrl
    },
    200
  );
})
}


