import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { table } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { Storage } from '@google-cloud/storage';
import { ulid } from 'ulidx';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.VOICE_NOTES_BUCKET;
if (!bucketName) {
  throw new Error('GCS_BUCKET_NAME environment variable is required');
}
const bucket = storage.bucket(bucketName);

const SuccessResponseSchema = z.object({
  voiceNoteUrl: z.string().url()
});

const ErrorResponseSchema = z.object({
  error: z.string()
});

const route = createRoute({
  method: 'post',
  operationId: 'uploadVoiceNote',
  tags: ['Patient'],
  path: '/patient/{patientId}/voice-note',
  summary: 'Upload a voice note for a specific patient and store the link',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      patientId: z.string().uuid()
    }),
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            voiceNote: z.any() // This will be a file upload
          })
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema
        }
      },
      description: 'Voice note uploaded successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Bad Request'
    },
    403: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description:
        'Forbidden - User does not have permission to upload for this patient'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Patient Not Found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Internal Server Error'
    }
  }
});

const handler = app.openapi(route, async c => {
  try {
    const { patientId } = c.req.valid('param');
    const formData = await c.req.formData();
    const voiceNote = formData.get('voiceNote');

    if (!voiceNote || !(voiceNote instanceof File)) {
      return c.json({ error: 'No voice note file provided' }, 400);
    }

    // Get the patient by ID
    const patient = await db
      .select()
      .from(table.patient.info)
      .where(eq(table.patient.info.patientId, patientId))
      .execute()
      .then(res => res[0]);

    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404);
    }

    // Check if the user has permission to upload for this patient
    const { userType, phoneNumber } = c.get('jwtPayload');

    // If user is a doctor, they can upload for any patient
    // If user is a patient, they can only upload for themselves
    if (userType === 'patient' && patient.phone !== phoneNumber) {
      return c.json(
        {
          error:
            'You do not have permission to upload voice notes for this patient'
        },
        403
      );
    }

    // Generate a unique filename with patient ID as folder and date-time
    const fileExtension = voiceNote.name.split('.').pop();
    const now = new Date();
    const dateTimeStr = now
      .toISOString()
      .replace(/[:.]/g, '-')
      .substring(0, 19);
    const fileName = `${
      patient.patientId
    }/${dateTimeStr}_${ulid()}.${fileExtension}`;

    // Upload to Google Cloud Storage
    const file = bucket.file(fileName);
    const buffer = await voiceNote.arrayBuffer();
    await file.save(Buffer.from(buffer), {
      metadata: {
        contentType: voiceNote.type
      }
    });

    // // Make the file publicly accessible
    // await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.cloud.google.com/${bucketName}/${fileName}`;

    // Add the new voice note URL to the array
    const updatedVoiceNotes = [...(patient.voiceNotes || []), publicUrl];
    await db
      .update(table.patient.info)
      .set({ voiceNotes: updatedVoiceNotes })
      .where(eq(table.patient.info.patientId, patientId))
      .execute();

    return c.json({ voiceNoteUrl: publicUrl }, 200);
  } catch (error) {
    console.error('Error uploading voice note:', error);
    return c.json({ error: 'Failed to upload voice note' }, 500);
  }
});

export type UploadVoiceNoteRoute = typeof handler;
export default route;
