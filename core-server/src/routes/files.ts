import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { tables } from "@/models";
import { Storage } from "@google-cloud/storage";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import path from "path";
import fs from "fs";

// Build absolute path to credentials file
const credentialsPath = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS || ""
);

let storage;

// ✅ Use credentials file if it exists, otherwise fallback to default
if (fs.existsSync(credentialsPath)) {
  storage = new Storage({ keyFilename: credentialsPath });
  console.info(`🧩 Using GCS credentials from: ${credentialsPath}`);
} else {
  storage = new Storage();
  console.info("☁️ Using default GCS credentials (Cloud Run)");
}

const bucketName = process.env.GCS_BUCKET_NAME!;
const bucket = storage.bucket(bucketName);

// Schema for files
const FilesSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  fileUrl: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create schema
const CreateFilesSchema = z.object({
  patientId: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  fileUrl: z.string(),
  description: z.string().optional(),
});

// Update schema
const UpdateFilesSchema = CreateFilesSchema.partial();

// Create route
const createFilesRoute = createRoute({
  method: "post",
  path: "/files",
  tags: ["Files"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateFilesSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FilesSchema,
        },
      },
      description: "File record created successfully",
    },
  },
});

// Get route
const getFilesRoute = createRoute({
  method: "get",
  path: "/files/:id",
  tags: ["Files"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FilesSchema,
        },
      },
      description: "File record retrieved successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "File record not found",
    },
  },
});

// Update route
const updateFilesRoute = createRoute({
  method: "put",
  path: "/files/:id",
  tags: ["Files"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateFilesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FilesSchema,
        },
      },
      description: "File record updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "File record not found",
    },
  },
});

// Delete route
const deleteFilesRoute = createRoute({
  method: "delete",
  path: "/files/:id",
  tags: ["Files"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "File record deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "File record not found",
    },
  },
});

// Create handler
const createFilesHandler = () => {
  app.openapi(createFilesRoute, async (c) => {
    const data = c.req.valid("json");
    const [record] = await db.insert(tables.files).values(data).returning();
    return c.json(record, 201);
  });
};

// Get handler
const getFilesHandler = () => {
  app.openapi(getFilesRoute, async (c) => {
    const { id } = c.req.valid("param");
    const [record] = await db
      .select()
      .from(tables.files)
      .where(eq(tables.files.id, id))
      .execute();

    if (!record) {
      return c.json({ error: "File record not found" }, 404);
    }

    return c.json(record);
  });
};

// Update handler
const updateFilesHandler = () => {
  app.openapi(updateFilesRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const [record] = await db
      .update(tables.files)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tables.files.id, id))
      .returning();

    if (!record) {
      return c.json({ error: "File record not found" }, 404);
    }

    return c.json(record);
  });
};

// Delete handler
const deleteFilesHandler = () => {
  app.openapi(deleteFilesRoute, async (c) => {
    const { id } = c.req.valid("param");
    const [record] = await db
      .delete(tables.files)
      .where(eq(tables.files.id, id))
      .returning();

    if (!record) {
      return c.json({ error: "File record not found" }, 404);
    }

    return c.body(null, 204);
  });
};

// //upload file route
const uploadFileRoute = createRoute({
  method: "post",
  path: "/files/upload",
  tags: ["Files"],
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            patientId: z.string().uuid(),
            file: z.any(),
            description: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FilesSchema,
        },
      },
      description: "File uploaded successfully",
    },
  },
});

async function getFileBuffer(file: unknown) {
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    };
  }

  throw new Error(
    "Unsupported file input. Make sure to send multipart/form-data from the client."
  );
}
const uploadFileHandler = () => {
  app.openapi(uploadFileRoute, async (c) => {
    console.log("=== Upload Request Start ===");

    let patientId: string;
    let description: string;
    let rawFile: unknown;
    let buffer: Buffer;
    let name: string;
    let type: string;
    let size: number;
    let uniqueName: string;
    let blob: any;
    let signedUrl: string;
    let record: any;

    try {
      // 1️⃣ Get form data
      const formData = await c.req.formData();
      console.log("Form data received.");

      patientId = formData.get("patientId") as string;
      description = (formData.get("description") as string) || "";
      rawFile = formData.get("file");

      console.log("Patient ID:", patientId);
      console.log("Description:", description);
      console.log("Raw file received:", !!rawFile);

      if (!rawFile)
        return c.json({ error: "No file uploaded", step: "file check" }, 400);
      if (!patientId)
        return c.json(
          { error: "Patient ID required", step: "patientId check" },
          400
        );
    } catch (err: any) {
      console.error("Form data parsing failed:", err);
      return c.json({ error: err.message, step: "form data parsing" }, 500);
    }

    try {
      // 2️⃣ Convert file to buffer
      console.log("Converting file to buffer...");
      ({ buffer, name, type, size } = await getFileBuffer(rawFile));
      buffer=buffer;
      console.log("File buffer created:", { name, type, size });
    } catch (err: any) {
      console.error("File conversion failed:", err);
      return c.json({ error: err.message, step: "file conversion" }, 500);
    }

    try {
      // 3️⃣ Generate unique filename
      const safeName = (name || "file").replace(/[\/\\]+/g, "_");
      uniqueName = `${randomUUID()}-${safeName}`;
      blob = bucket.file(uniqueName);
      console.log("Unique filename:", uniqueName);
    } catch (err: any) {
      console.error("Generating unique filename failed:", err);
      return c.json({ error: err.message, step: "filename generation" }, 500);
    }

    try {
      // 4️⃣ Upload to GCS
      console.log("Uploading file to GCS...");
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(
            blob.createWriteStream({
              contentType: type,
              resumable: false,
              metadata: { cacheControl: "public, max-age=31536000" },
            })
          )
          .on("error", reject)
          .on("finish", resolve);
      });
      console.log("GCS upload finished.");
    } catch (err: any) {
      console.error("GCS upload failed:", err);
      return c.json(
        { error: err.message, step: "GCS uploaded", body: rawFile },
        500
      );
    }

    try {
      // 5️⃣ Generate signed URL
      console.log("Generating signed URL...");
      [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
      });
      console.log("Signed URL generated:", signedUrl);
    } catch (err: any) {
      console.error("Signed URL generation failed:", err);
      return c.json({ error: err.message, step: "signed URL generation" }, 500);
    }

    try {
      // 6️⃣ Save record in DB
      console.log("Saving record to database...");
      [record] = await db
        .insert(tables.files)
        .values({
          patientId,
          fileName: name,
          fileType: type,
          fileUrl: signedUrl,
          summary: description,
        })
        .returning();
      console.log("Database record saved:", record.id);
    } catch (err: any) {
      console.error("Database insertion failed:", err);
      return c.json({ error: err.message, step: "database insertion" }, 500);
    }

    // 7️⃣ Return final response
    console.log("Upload completed successfully.");
    return c.json(
      {
        id: record.id,
        patientId: record.patientId,
        fileName: record.fileName,
        fileType: record.fileType,
        fileSize: size,
        fileUrl: record.fileUrl,
        description,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      201
    );
  });
};

export {
  createFilesHandler,
  getFilesHandler,
  updateFilesHandler,
  deleteFilesHandler,
  uploadFileHandler,
};
