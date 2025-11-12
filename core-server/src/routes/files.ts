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

//upload file route
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

async function getFileBuffer(rawFile: any) {
  console.log("📦 [getFileBuffer] Entry - rawFile type:", typeof rawFile);
  console.log("📦 [getFileBuffer] rawFile instanceof File:", rawFile instanceof File);
  console.log("📦 [getFileBuffer] rawFile instanceof Blob:", rawFile instanceof Blob);
  console.log("📦 [getFileBuffer] rawFile is object:", typeof rawFile === "object");
  console.log("📦 [getFileBuffer] rawFile has filepath:", rawFile && typeof rawFile === "object" && "filepath" in rawFile);
  
  if (rawFile && typeof rawFile === "object") {
    console.log("📦 [getFileBuffer] rawFile keys:", Object.keys(rawFile));
    console.log("📦 [getFileBuffer] rawFile value:", JSON.stringify(rawFile, null, 2));
  }

  // ✅ Browser or platform returning File/Blob
  if (rawFile instanceof File || rawFile instanceof Blob) {
    console.log("📦 [getFileBuffer] Processing as File/Blob");
    console.log("📦 [getFileBuffer] File name:", rawFile.name);
    console.log("📦 [getFileBuffer] File type:", rawFile.type);
    console.log("📦 [getFileBuffer] File size:", rawFile.size);
    
    const arr = await rawFile.arrayBuffer();
    console.log("📦 [getFileBuffer] ArrayBuffer size:", arr.byteLength);
    
    return {
      buffer: Buffer.from(arr),
      name: rawFile.name ?? "upload.bin",
      type: rawFile.type ?? "application/octet-stream",
      size: rawFile.size,
    };
  }

  // ✅ Bun backend object that contains filepath
  if (rawFile && typeof rawFile === "object" && "filepath" in rawFile) {
    console.log("📦 [getFileBuffer] Processing as filepath object");
    const { filepath, originalFilename, mimetype, size } = rawFile;
    
    console.log("📦 [getFileBuffer] filepath:", filepath);
    console.log("📦 [getFileBuffer] originalFilename:", originalFilename);
    console.log("📦 [getFileBuffer] mimetype:", mimetype);
    console.log("📦 [getFileBuffer] size:", size);

    if (!filepath) {
      console.error("❌ [getFileBuffer] Missing filepath!");
      throw new Error("Invalid file object: missing filepath");
    }

    // Check filepath before reading
    console.log("📦 [getFileBuffer] Checking filepath stats...");
    try {
      const stats = await fs.promises.stat(filepath);
      console.log("📦 [getFileBuffer] Stats - isFile:", stats.isFile());
      console.log("📦 [getFileBuffer] Stats - isDirectory:", stats.isDirectory());
      console.log("📦 [getFileBuffer] Stats - mode:", stats.mode);
      console.log("📦 [getFileBuffer] Stats - size:", stats.size);
      
      if (stats.isDirectory()) {
        console.error("❌ [getFileBuffer] Filepath is a directory!");
        throw new Error("Uploaded path is a directory, not a file");
      }
      
      if (!stats.isFile()) {
        console.error("❌ [getFileBuffer] Filepath is not a file!");
        throw new Error("Uploaded path is not a file");
      }
    } catch (statErr: any) {
      console.error("❌ [getFileBuffer] Error checking stats:", statErr);
      console.error("❌ [getFileBuffer] Error code:", statErr.code);
      console.error("❌ [getFileBuffer] Error message:", statErr.message);
      throw statErr;
    }

    // ✅ Use Node fs.readFile instead of Bun.file
    console.log("📦 [getFileBuffer] About to read file with fs.promises.readFile...");
    let buffer;
    try {
      buffer = await fs.promises.readFile(filepath);
      console.log("✅ [getFileBuffer] Successfully read file!");
      console.log("📦 [getFileBuffer] Buffer length:", buffer.length);
      console.log("📦 [getFileBuffer] Buffer byteLength:", buffer.byteLength);
    } catch (readErr: any) {
      console.error("❌ [getFileBuffer] Error reading file:", readErr);
      console.error("❌ [getFileBuffer] Error code:", readErr.code);
      console.error("❌ [getFileBuffer] Error syscall:", readErr.syscall);
      console.error("❌ [getFileBuffer] Error errno:", readErr.errno);
      console.error("❌ [getFileBuffer] Error message:", readErr.message);
      throw readErr;
    }

    const result = {
      buffer,
      name: originalFilename ?? "upload.bin",
      type: mimetype ?? "application/octet-stream",
      size: size ?? buffer.byteLength,
    };
    
    console.log("📦 [getFileBuffer] Returning result - name:", result.name);
    console.log("📦 [getFileBuffer] Returning result - type:", result.type);
    console.log("📦 [getFileBuffer] Returning result - size:", result.size);
    
    return result;
  }

  console.error("❌ [getFileBuffer] Unsupported file input type");
  throw new Error("Unsupported file input type");
}

// --- Upload handler ---

const uploadFileHandler = () => {
  app.openapi(uploadFileRoute, async (c) => {
    console.log("🚀 [uploadFileHandler] ===== FILE UPLOAD STARTED =====");
    console.log("🚀 [uploadFileHandler] Request URL:", c.req.url);
    console.log("🚀 [uploadFileHandler] Request method:", c.req.method);
    
    try {
      console.log("🚀 [uploadFileHandler] Step 1: Getting formData...");
      const formData = await c.req.formData();
      console.log("✅ [uploadFileHandler] FormData received");
      
      console.log("🚀 [uploadFileHandler] Step 2: Extracting form fields...");
      const patientId = formData.get("patientId") as string;
      const description = (formData.get("description") as string) || "";
      const rawFile = formData.get("file");
      
      console.log("📋 [uploadFileHandler] patientId:", patientId);
      console.log("📋 [uploadFileHandler] description:", description);
      console.log("📋 [uploadFileHandler] rawFile exists:", !!rawFile);
      console.log("📋 [uploadFileHandler] rawFile type:", typeof rawFile);

      if (!rawFile) {
        console.error("❌ [uploadFileHandler] No file uploaded");
        return c.json({ error: "No file uploaded" }, 400);
      }
      
      if (!patientId) {
        console.error("❌ [uploadFileHandler] Patient ID required");
        return c.json({ error: "Patient ID required" }, 400);
      }

      // Validate file input - ensure it's not empty or invalid
      console.log("🚀 [uploadFileHandler] Step 3: Validating file input...");
      if (
        typeof rawFile === "object" &&
        "filepath" in rawFile &&
        !rawFile.filepath
      ) {
        console.error("❌ [uploadFileHandler] Empty file path");
        return c.json({ error: "Invalid file upload: empty file path" }, 400);
      }
      console.log("✅ [uploadFileHandler] File validation passed");

      // Convert to buffer safely
      console.log("🚀 [uploadFileHandler] Step 4: Converting file to buffer...");
      const { buffer, name, type, size } = await getFileBuffer(rawFile);
      console.log("✅ [uploadFileHandler] File converted to buffer");
      console.log("📋 [uploadFileHandler] File name:", name);
      console.log("📋 [uploadFileHandler] File type:", type);
      console.log("📋 [uploadFileHandler] File size:", size);
      console.log("📋 [uploadFileHandler] Buffer length:", buffer.length);

      // Unique filename
      console.log("🚀 [uploadFileHandler] Step 5: Generating unique filename...");
      const uniqueName = `${randomUUID()}-${name}`;
      console.log("📋 [uploadFileHandler] Unique name:", uniqueName);
      const blob = bucket.file(uniqueName);
      console.log("✅ [uploadFileHandler] GCS blob created");

      // Upload file to GCS
      console.log("🚀 [uploadFileHandler] Step 6: Uploading to GCS...");
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      console.log("📋 [uploadFileHandler] Stream created, starting upload...");

      await new Promise<void>((resolve, reject) => {
        const writeStream = blob.createWriteStream({
          contentType: type,
          resumable: false,
          metadata: {
            cacheControl: "public, max-age=31536000",
          },
        });
        
        writeStream.on("error", (err) => {
          console.error("❌ [uploadFileHandler] GCS upload error:", err);
          reject(err);
        });
        
        writeStream.on("finish", () => {
          console.log("✅ [uploadFileHandler] GCS upload finished");
          resolve();
        });
        
        stream.pipe(writeStream);
      });
      console.log("✅ [uploadFileHandler] File uploaded to GCS successfully");

      // ✅ Generate signed URL (instead of makePublic)
      console.log("🚀 [uploadFileHandler] Step 7: Generating signed URL...");
      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // valid for 30 days
      });
      console.log("✅ [uploadFileHandler] Signed URL generated");
      console.log("📋 [uploadFileHandler] Signed URL length:", signedUrl.length);

      // Save record in DB
      console.log("🚀 [uploadFileHandler] Step 8: Saving to database...");
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
      console.log("✅ [uploadFileHandler] Database record saved");
      console.log("📋 [uploadFileHandler] Record ID:", record.id);

      // Return response
      console.log("🚀 [uploadFileHandler] Step 9: Preparing response...");
      const response = {
        id: record.id,
        patientId: record.patientId,
        fileName: record.fileName,
        fileType: record.fileType,
        fileSize: size,
        fileUrl: record.fileUrl,
        description,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
      
      console.log("✅ [uploadFileHandler] ===== FILE UPLOAD SUCCESS =====");
      return c.json(response, 201);
    } catch (err: any) {
      console.error("❌ [uploadFileHandler] ===== FILE UPLOAD ERROR =====");
      console.error("❌ [uploadFileHandler] Error type:", typeof err);
      console.error("❌ [uploadFileHandler] Error name:", err?.name);
      console.error("❌ [uploadFileHandler] Error code:", err?.code);
      console.error("❌ [uploadFileHandler] Error syscall:", err?.syscall);
      console.error("❌ [uploadFileHandler] Error errno:", err?.errno);
      console.error("❌ [uploadFileHandler] Error message:", err?.message);
      console.error("❌ [uploadFileHandler] Error stack:", err?.stack);
      console.error("❌ [uploadFileHandler] Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.error("File upload error::=> ", err);
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
