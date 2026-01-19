import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { getTranscription } from "@/services/transcription";
import { Storage } from "@google-cloud/storage";
import { createRoute, z } from "@hono/zod-openapi";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { ulid } from "ulidx";

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
    // phone: z.string(),
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

const CreatePatientRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15),
  husbandName: z.string().optional(),
  cnic: z.string().min(13, "CNIC must be 13 digits").max(15),
  age: z.string().optional(),
  gestationalAge: z.string().optional(),
});

const CreatePatientResponseSchema = z.object({
  message: z.string(),
  patient: z.object({
    id: z.string().uuid(),
    name: z.string(),
    phoneNumber: z.string(),
    cnic: z.string(),
    age: z.string().nullable(),
    gestationalAge: z.string().nullable(),
    location: z.string().nullable(),
    createdAt: z.date(),
  }),
});

const CreatePatientConflictSchema = z.object({
  error: z.string().openapi({
    example: "Patient already exists with this phone number",
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
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(20),
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

const searchPatientsHandler = () => {
  app.openapi(searchPatientsRoute, async (c) => {
    const { searchKey, page, pageSize } = c.req.valid("query");

    const offset = (page - 1) * pageSize;

    let patients;
    let totalCount = 0;
 

    try {
      const whereCondition =
        searchKey && searchKey.trim().length >= 3
          ? or(
              ilike(tables.patient.name, `%${searchKey}%`),
              ilike(tables.patient.phoneNumber, `%${searchKey}%`),
              ilike(tables.patient.cnic, `%${searchKey}%`)
            )
          : undefined;

      // 🔹 TOTAL COUNT
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tables.patient)
        .where(whereCondition)
        .execute();

      totalCount = Number(countResult[0].count);

      // 🔹 DATA
      patients = await db
        .select()
        .from(tables.patient)
        .where(whereCondition)
        .orderBy(desc(tables.patient.createdAt))
        .limit(pageSize)
        .offset(offset)
        .execute();

      if (patients.length === 0) {
        return c.json({ error: "No patients found" }, 404);
      }
    } catch (error: any) {
      const message = error?.message || "";
      const code = error?.code;

      if (code === "42703" || message.includes("column")) {
        // fallback SQL
        const whereSql =
          searchKey && searchKey.trim().length >= 3
            ? sql`WHERE name ILIKE ${"%" + searchKey + "%"}
                  OR phone_number ILIKE ${"%" + searchKey + "%"}
                  OR cnic ILIKE ${"%" + searchKey + "%"}
                  OR id ILIKE ${"%" + searchKey + "%"}`
            : sql``;

        const countQuery = await db.execute(
          sql`SELECT count(*) FROM patient ${whereSql}`
        );
        totalCount = Number(countQuery[0].count);

        patients = await db.execute(
          sql`
          SELECT id, name, phone_number, cnic, location, created_at, updated_at
          FROM patient
          ${whereSql}
          ORDER BY created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `
        );
      } else {
        console.error("❌ DB error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }

    const totalPages = Math.ceil(totalCount / pageSize);

    return c.json(
      {
        data: patients,
        pagination: {
          totalRecords: totalCount,
          totalPages,
          currentPage: page,
          pageSize,
        },
      },
      200
    );
  });
};

// Get Patient Info Schema
const SuccessResponseSchema = z.object({
  name: z.string().openapi({
    example: "Nazia",
  }),
  phoneNumber: z.string().openapi({
    example: "03001234567",
  }),
  location: z.string().openapi({
    example: "45 A, Society, Main Road, Karachi",
  }),
  createdAt: z.string(),
});

const getPatientInfoRoute = createRoute({
  method: "get",
  operationId: "getPatientInfo",
  tags: ["Patient"],
  path: "/patient/info/{phoneNumber}",
  summary:
    "Allows the Healthcare Practitioner to Get Patient Info Such as Name and Location Based on their Phone",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      phoneNumber: z.string().openapi({
        example: "03001234567",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
      description: "Patient info",
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

const getPatientInfoHandler = () => {
  app.openapi(getPatientInfoRoute, async (c) => {
    const { phoneNumber } = c.req.valid("param");

    // Check if the patient record already exists
    const patient = await db
      .select()
      .from(tables.patient)
      .where(eq(tables.patient.phoneNumber, phoneNumber))
      .then((res) => res.at(0));

    if (!patient) {
      return c.json(
        {
          error: `No Patient Info Record found with phone number ${phoneNumber}`,
        },
        404
      );
    }

    const { ...response } = patient;

    return c.json(response, 200);
  });
};

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
      description:
        "Forbidden - User does not have permission to upload for this patient",
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

const uploadVoiceNoteHandler = () => {
  app.openapi(uploadVoiceNoteRoute, async (c) => {
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
      const buffer = Buffer.from(await voiceNote.arrayBuffer());
      await file.save(buffer, {
        metadata: {
          contentType: voiceNote.type,
        },
      });

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

      // Add the new voice note object to the array
      let transcription = null;
      try {
        const result = await getTranscription({ file: buffer });
        if ("text" in result) {
          transcription = result.text;
        } else if ("clientError" in result) {
          transcription = result.clientError;
        } else {
          transcription = null;
        }
      } catch (err) {
        transcription = null;
      }

      const newVoiceNote = {
        url: publicUrl,
        transcription,
        createdAt: new Date().toISOString(),
      };
      const currentVoiceNotes = Array.isArray(patient.voiceNotes)
        ? patient.voiceNotes
        : [];
      const updatedVoiceNotes = [...currentVoiceNotes, newVoiceNote];
      await db
        .update(tables.patient)
        .set({ voiceNotes: updatedVoiceNotes })
        .where(eq(tables.patient.id, patientId))
        .execute();

      return c.json({ voiceNoteUrl: publicUrl, transcription }, 200);
    } catch (error) {
      console.error("Error uploading voice note:", error);
      return c.json({ error: "Failed to upload voice note" }, 500);
    }
  });
};

// Edit Patient Schema
const EditPatientRequestSchema = z.object({
  name: z.string().optional(),
  age: z.string().optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  cnic: z.string().optional(),
  education: z.string().optional(),
  marriedYears: z.string().optional(),
  pregnancyMonths: z.string().optional(),
  gestationalAge: z.string().optional(),
  miscarriage: z.string().optional(),
  firstPregnancy: z.string().optional(),
  familyMarriage: z.string().optional(),
  husbandPhoneNumber: z.string().optional(),
  husbandName:z.string().optional(),
  patientBloodGroup: z.string().optional(),
  husbandBloodGroup: z.string().optional(),
  lastMenstruationDate: z.string().optional(),
  totalPregnancies: z.string().optional(),
  miscarriages: z.string().optional(),
  miscarriageTiming: z.string().optional(),
  stillbirths: z.string().optional(),
  neonatalDeaths: z.string().optional(),
  livingChildren: z.string().optional(),
});

const EditPatientSuccessSchema = z.object({
  message: z.string(),
  patient: z.object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    name: z.string().nullable(),
    age: z.string().nullable(),
    maritalStatus: z.string().nullable(),
    occupation: z.string().nullable(),
    location: z.string().nullable(),
    cnic: z.string().nullable(),
    education: z.string().nullable(),
    marriedYears: z.string().nullable(),
    pregnancyMonths: z.string().nullable(),
    husbandName:z.string().optional(),
    gestationalAge: z.string().nullable(),
    miscarriage: z.string().nullable(),
    firstPregnancy: z.string().nullable(),
    familyMarriage: z.string().nullable(),
    husbandPhoneNumber: z.string().nullable(),
    patientBloodGroup: z.string().nullable(),
    husbandBloodGroup: z.string().nullable(),
    lastMenstruationDate: z.string().nullable(),
    totalPregnancies: z.string().nullable(),
    miscarriages: z.string().nullable(),
    miscarriageTiming: z.string().nullable(),
    stillbirths: z.string().nullable(),
    neonatalDeaths: z.string().nullable(),
    livingChildren: z.string().nullable(),
    hospitalId: z.string().uuid().nullable(),
    updatedAt: z.date(),
  }),
});

const EditPatientNotFoundSchema = z.object({
  error: z.string().openapi({ example: "Patient not found" }),
});

const editPatientRoute = createRoute({
  method: "put",
  operationId: "editPatient",
  tags: ["Patient"],
  path: "/patient/{patientId}",
  summary: "Edit patient information",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      patientId: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: EditPatientRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EditPatientSuccessSchema,
        },
      },
      description: "Patient information updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: EditPatientNotFoundSchema,
        },
      },
      description: "Patient not found",
    },
  },
});

const editPatientHandler = () => {
  app.openapi(editPatientRoute, async (c) => {
    const { patientId } = c.req.valid("param");
    const updates = c.req.valid("json");

    // Check if the patient exists
    const existingPatient = await db
      .select()
      .from(tables.patient)
      .where(eq(tables.patient.id, patientId))
      .then((res) => res.at(0));

    if (!existingPatient) {
      return c.json(
        { error: `No Patient Record found with ID ${patientId}` },
        404
      );
    }

    // Update the patient record
    const [updatedPatient] = await db
      .update(tables.patient)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tables.patient.id, patientId))
      .returning();

    return c.json(
      {
        message: "Patient updated successfully",
        patient: updatedPatient,
      },
      200
    );
  });
};

const createPatientRoute = createRoute({
  method: "post",
  operationId: "createPatient",
  tags: ["Patient"],
  path: "/patient",
  summary: "Create a new patient record",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePatientRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CreatePatientResponseSchema,
        },
      },
      description: "Patient created successfully",
    },
    409: {
      content: {
        "application/json": {
          schema: CreatePatientConflictSchema,
        },
      },
      description: "Duplicate patient found",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Invalid input data",
    },
  },
});

const createPatientHandler = () => {
  app.openapi(createPatientRoute, async (c) => {
    try {
      const body = c.req.valid("json");
      const { name, phoneNumber, husbandName, cnic, age, gestationalAge } =
        body;

      // Check for existing patient by phone number
      const existing = await db
        .select()
        .from(tables.patient)
        .where(eq(tables.patient.phoneNumber, phoneNumber))
        .then((res) => res.at(0));

      if (existing) {
        return c.json(
          { error: "Patient already exists with this phone number" },
          409
        );
      }

      // Create patient record
      const [newPatient] = await db
        .insert(tables.patient)
        .values({
          name,
          phoneNumber,
          husbandName,
          cnic,
          age: age || null,
          gestationalAge,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(
        {
          message: "Patient created successfully",
          patient: newPatient,
        },
        201
      );
    } catch (error: any) {
      console.error("Error creating patient:", error);
      return c.json({ error: "Failed to create patient" }, 500);
    }
  });
};



export {
  createPatientHandler,
  editPatientHandler,
  getPatientInfoHandler,
  searchPatientsHandler,
  uploadVoiceNoteHandler,
};
