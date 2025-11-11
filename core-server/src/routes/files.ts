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

import { File } from "formdata-node";

async function getFileBuffer(rawFile: unknown) {
  if (!rawFile) throw new Error("No file provided");

  // Node FormData file
  if (rawFile instanceof File) {
    const buffer = Buffer.from(await rawFile.arrayBuffer());
    return {
      buffer,
      name: rawFile.name,
      type: rawFile.type || "application/octet-stream",
      size: buffer.byteLength,
    };
  }

  // Possibly a Readable stream (like multer)
  if ((rawFile as any).path) {
    const fs = await import("fs/promises");
    const path = (rawFile as any).path;
    const stats = await fs.stat(path);

    if (stats.isDirectory()) throw new Error("File cannot be a directory");

    const buffer = await fs.readFile(path);
    return {
      buffer,
      name: (rawFile as any).originalname || "upload.bin",
      type: (rawFile as any).mimetype || "application/octet-stream",
      size: buffer.byteLength,
    };
  }

  throw new Error("Unsupported file input format");
}


// --- Upload handler ---

const uploadFileHandler = () => {
  app.openapi(uploadFileRoute, async (c) => {
    try {
      const formData = await c.req.formData();
      const patientId = formData.get("patientId") as string;
      const description = (formData.get("description") as string) || "";
      const rawFile = formData.get("file");

      if (!rawFile) return c.json({ error: "No file uploaded" }, 400);
      if (!patientId) return c.json({ error: "Patient ID required" }, 400);

      const { buffer, name, type, size } = await getFileBuffer(rawFile);

      const uniqueName = `${randomUUID()}-${name}`;
      const blob = bucket.file(uniqueName);

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

      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
      });

      const [record] = await db
        .insert(tables.files)
        .values({
          patientId,
          fileName: name,
          fileType: type,
          fileUrl: signedUrl,
          summary: description,
        })
        .returning();

      return c.json({
        id: record.id,
        patientId: record.patientId,
        fileName: record.fileName,
        fileType: record.fileType,
        fileSize: size,
        fileUrl: record.fileUrl,
        description,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }, 201);

    } catch (err: any) {
      console.error("File upload error:", err);
      return c.json({ error: err.message || "File upload failed" }, 500);
    }
  });
};

 export default uploadFileHandler;

export {
  createFilesHandler,
  getFilesHandler,
  updateFilesHandler,
  deleteFilesHandler,
  uploadFileHandler,
};
