import app from '@/app';
import { db } from '@/db';
import { jwtMiddleware } from '@/middleware/jwt';
import { tables } from '@/models';
import { createRoute, z } from '@hono/zod-openapi';
import { eq, ilike, or, desc } from 'drizzle-orm';
import { Storage } from '@google-cloud/storage';
import { ulid } from 'ulidx';
import { UserRole } from '@/models/user';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.VOICE_NOTES_BUCKET;
if (!bucketName) {
  throw new Error("GCS_BUCKET_NAME environment variable is required");
}
const bucket = storage.bucket(bucketName);

// Search Patients Schema
const PatientSearchResponseSchema = z.array(
  z.object({
    patientId: z.string().uuid(),
    phone: z.string(),
    name: z.string(),
    location: z.string(),
    cnic: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    prevPregnancies: z.record(z.unknown()).nullable(),
  })
);

const NotFoundSchema = z.object({
  error: z.string().openapi({
    example: "No patients found for the given search key",
  }),
});

const searchPatientsRoute = createRoute({
  method: "get",
  operationId: "searchPatients",
  tags: ["Patient"],
  path: "/patient/search",
  summary: "Search patients by name, phone number, or CNIC",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      searchKey: z
        .string()
        .trim()
        .min(3)
        .optional()
        .or(z.literal("").transform(() => undefined)),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PatientSearchResponseSchema,
        },
      },
      description: "Returns a list of matching patients",
    },
    404: {
      content: {
        "application/json": {
          schema: NotFoundSchema,
        },
      },
      description: "Not Found",
    },
  },
});

const searchPatientsHandler = app.openapi(searchPatientsRoute, async (c) => {
  const { searchKey } = c.req.valid("query");
  let patients;

  if (searchKey && searchKey.trim().length >= 3) {
    patients = await db
      .select()
      .from(tables.patient)
      .where(
        or(
          ilike(tables.patient.name, `%${searchKey}%`),
          ilike(tables.patient.phoneNumber, `%${searchKey}%`),
          ilike(tables.patient.cnic, `%${searchKey}%`)
        )
      )
      .orderBy(desc(tables.patient.createdAt)) // 👈 sort by latest
      .limit(50)
      .execute();

    if (patients.length === 0) {
      return c.json(
        { error: "No patients found for the given search key" },
        404
      );
    }
  } else {
    // Return initial 20 records
    patients = await db
      .select()
      .from(tables.patient)
      .orderBy(desc(tables.patient.createdAt)) // 👈 sort by latest
      .limit(20)
      .execute();
  }

  return c.json(patients, 200);
});

// Get Patient Info Schema
const SuccessResponseSchema = z.object({
  name: z.string().openapi({
    example: 'Nazia',
  }),
  phoneNumber: z.string().openapi({
    example: '03001234567',
  }),
  location: z.string().openapi({
    example: '45 A, Society, Main Road, Karachi',
  }),
  createdAt: z.string(),
});

const getPatientInfoRoute = createRoute({
  method: 'get',
  operationId: 'getPatientInfo',
  tags: ['Patient'],
  path: '/patient/info/{phoneNumber}',
  summary: 'Allows the Healthcare Practitioner to Get Patient Info Such as Name and Location Based on their Phone',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      phoneNumber: z.string().openapi({
        example: '03001234567',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
      description: 'Patient info',
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundSchema,
        },
      },
      description: 'Not Found',
    },
  },
});

const getPatientInfoHandler = app.openapi(getPatientInfoRoute, async (c) => {
  const { phoneNumber } = c.req.valid('param');

  // Check if the patient record already exists
  const patient = await db
    .select()
    .from(tables.patient)
    .where(eq(tables.patient.phoneNumber, phoneNumber))
    .then((res) => res.at(0));

  if (!patient) {
    return c.json({ error: `No Patient Info Record found with phone number ${phoneNumber}` }, 404);
  }

  const { ...response } = patient;

  return c.json(response, 200);
});

// Upload Voice Note Schema
const UploadVoiceNoteSuccessResponseSchema = z.object({
  voiceNoteUrl: z.string().url(),
});

const UploadVoiceNoteErrorResponseSchema = z.object({
  error: z.string(),
});

const uploadVoiceNoteRoute = createRoute({
  method: "post",
  operationId: "uploadVoiceNote",
  tags: ["Patient"],
  path: "/patient/{patientId}/voiceNote",
  summary: "Upload a voice note for a specific patient and store the link",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      patientId: z.string().uuid(),
    }),
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            voiceNote: z.any(), // This will be a file upload
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UploadVoiceNoteSuccessResponseSchema,
        },
      },
      description: "Voice note uploaded successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: UploadVoiceNoteErrorResponseSchema,
        },
      },
      description: "Bad Request",
    },
    403: {
      content: {
        "application/json": {
          schema: UploadVoiceNoteErrorResponseSchema,
        },
      },
      description: "Forbidden - User does not have permission to upload for this patient",
    },
    404: {
      content: {
        "application/json": {
          schema: UploadVoiceNoteErrorResponseSchema,
        },
      },
      description: "Patient Not Found",
    },
    500: {
      content: {
        "application/json": {
          schema: UploadVoiceNoteErrorResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
});

const uploadVoiceNoteHandler = app.openapi(uploadVoiceNoteRoute, async (c) => {
  try {
    const { patientId } = c.req.valid("param");
    const formData = await c.req.formData();
    const voiceNote = formData.get("voiceNote");

    if (!voiceNote || !(voiceNote instanceof File)) {
      return c.json({ error: "No voice note file provided" }, 400);
    }

    // Get the patient by ID
    const patient = await db
      .select()
      .from(tables.patient)
      .where(eq(tables.patient.id, patientId))
      .execute()
      .then((res) => res[0]);

    if (!patient) {
      return c.json({ error: "Patient not found" }, 404);
    }

    // Check if the user has permission to upload for this patient
    const { role, phoneNumber } = c.get("jwtPayload");

    // If user is a doctor, they can upload for any patient
    // If user is a patient, they can only upload for themselves
    if (role === UserRole.Patient && patient.phoneNumber !== phoneNumber) {
      return c.json(
        {
          error:
            "You do not have permission to upload voice notes for this patient",
        },
        403
      );
    }

    // Generate a unique filename with patient ID as folder and date-time
    const fileExtension = voiceNote.name.split(".").pop();
    const now = new Date();
    const dateTimeStr = now
      .toISOString()
      .replace(/[:.]/g, "-")
      .substring(0, 19);
    const fileName = `${
      patient.id
    }/${dateTimeStr}_${ulid()}.${fileExtension}`;

    // Upload to Google Cloud Storage
    const file = bucket.file(fileName);
    const buffer = await voiceNote.arrayBuffer();
    await file.save(Buffer.from(buffer), {
      metadata: {
        contentType: voiceNote.type
      }
    });

    // Get the public URL
    const publicUrl = `https://storage.cloud.google.com/${bucketName}/${fileName}`;
    // Add the new voice note URL to the array
    const currentVoiceNotes = Array.isArray(patient.voiceNotes) ? patient.voiceNotes : [];
    const updatedVoiceNotes = [...currentVoiceNotes, publicUrl];
    await db
      .update(tables.patient)
      .set({ voiceNotes: updatedVoiceNotes })
      .where(eq(tables.patient.id, patientId))
      .execute();

    return c.json({ voiceNoteUrl: publicUrl }, 200);
  } catch (error) {
    console.error("Error uploading voice note:", error);
    return c.json({ error: "Failed to upload voice note" }, 500);
  }
});

// Edit Patient Schema
const EditPatientRequestSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  location: z.string().optional(),
  cnic: z.string().optional(),
  education: z.string().optional(),
  marriedYears: z.number().optional(),
  pregnancyMonths: z.number().optional(),
  miscarriage: z.string().optional(),
  firstPregnancy: z.string().optional(),
  familyMarriage: z.string().optional()
});

const EditPatientSuccessSchema = z.object({
  message: z.string(),
  patient: z.object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    name: z.string().nullable(),
    age: z.number().nullable(),
    gender: z.string().nullable(),
    maritalStatus: z.string().nullable(),
    occupation: z.string().nullable(),
    address: z.string().nullable(),
    location: z.string().nullable(),
    cnic: z.string().nullable(),
    education: z.string().nullable(),
    marriedYears: z.number().nullable(),
    pregnancyMonths: z.number().nullable(),
    miscarriage: z.string().nullable(),
    firstPregnancy: z.string().nullable(),
    familyMarriage: z.string().nullable(),
    updatedAt: z.date()
  })
});

const EditPatientNotFoundSchema = z.object({
  error: z.string().openapi({ example: 'Patient not found' })
});

const editPatientRoute = createRoute({
  method: 'put',
  operationId: 'editPatient',
  tags: ['Patient'],
  path: '/patient/{patientId}',
  summary: 'Edit patient information',
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      patientId: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: EditPatientRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: EditPatientSuccessSchema
        }
      },
      description: 'Patient information updated successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: EditPatientNotFoundSchema
        }
      },
      description: 'Patient not found'
    }
  }
});

const editPatientHandler = app.openapi(editPatientRoute, async (c) => {
  const { patientId } = c.req.valid('param');
  const updates = c.req.valid('json');

  // Check if patient exists
  const existingPatient = await db
    .select()
    .from(tables.patient)
    .where(eq(tables.patient.id, patientId))
    .execute()
    .then(res => res.at(0));

  if (!existingPatient) {
    return c.json({ error: 'Patient not found' }, 404);
  }

  // Update patient information
  const [updatedPatient] = await db
    .update(tables.patient)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(tables.patient.id, patientId))
    .returning();

  return c.json({
    message: 'Patient information updated successfully',
    patient: updatedPatient
  }, 200);
});

const patientRoute = {
  getRoutingPath: () => {
    app.openapi(searchPatientsRoute, searchPatientsHandler);
    app.openapi(getPatientInfoRoute, getPatientInfoHandler);
    app.openapi(uploadVoiceNoteRoute, uploadVoiceNoteHandler);
    app.openapi(editPatientRoute, editPatientHandler);
  }
};

export type SearchPatientsRoute = typeof searchPatientsHandler;
export type GetPatientInfoRoute = typeof getPatientInfoHandler;
export type UploadVoiceNoteRoute = typeof uploadVoiceNoteHandler;
export type EditPatientRoute = typeof editPatientHandler;

export default patientRoute;
