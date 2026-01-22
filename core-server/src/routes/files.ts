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
import OpenAI from "openai";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
const { PDFParse } = require("pdf-parse");

// // Build absolute path to credentials file
// const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
//   ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
//   : "";

const credentialsPath = path.resolve(
  __dirname,
  "../../credentials/gcs-service-account.json",
);

let storage;

// ✅ Use credentials file if it exists AND is a file (not a directory), otherwise fallback to default
if (credentialsPath) {
  try {
    const stats = fs.statSync(credentialsPath);
    if (stats.isFile()) {
      storage = new Storage({ keyFilename: credentialsPath });
      console.info(`🧩 Using GCS credentials from: ${credentialsPath}`);
    } else {
      console.warn(
        `⚠️ GOOGLE_APPLICATION_CREDENTIALS points to a directory, not a file: ${credentialsPath}`,
      );
      console.info("☁️ Falling back to default GCS credentials (Cloud Run)");
      storage = new Storage();
    }
  } catch (err: any) {
    console.warn(
      `⚠️ Could not access credentials file at ${credentialsPath}:`,
      err.message,
    );
    console.info("☁️ Falling back to default GCS credentials (Cloud Run)");
    storage = new Storage();
  }
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

async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  // PDF
  if (mimeType === "application/pdf" || ext === ".pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text?.trim() || "";
    } catch (err) {
      console.error("PDF text extraction failed:", err);
      return "";
    }
  }

  // DOCX
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || "";
  }

  // TEXT FILE
  if (mimeType.startsWith("text/") || ext === ".txt") {
    return buffer.toString("utf-8").trim();
  }

  // IMAGE (OCR)
  if (mimeType.startsWith("image/")) {
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, "eng");
    return text.trim();
  }

  throw new Error("Unsupported file type");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function generateSummary(content: string): Promise<string> {
  if (!content || content.trim().length < 50) {
    return "File content too short to summarize.";
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You summarize medical and general documents clearly.",
      },
      {
        role: "user",
        content: `Summarize this file:\n\n${content.slice(0, 500)}`,
      },
    ],
    temperature: 0.3,
  });

  return res.choices[0].message?.content ?? "Summary not generated.";
}

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
  console.log(
    "📦 [getFileBuffer] rawFile instanceof File:",
    rawFile instanceof File,
  );
  console.log(
    "📦 [getFileBuffer] rawFile instanceof Blob:",
    rawFile instanceof Blob,
  );
  console.log(
    "📦 [getFileBuffer] rawFile is object:",
    typeof rawFile === "object",
  );
  console.log(
    "📦 [getFileBuffer] rawFile has filepath:",
    rawFile && typeof rawFile === "object" && "filepath" in rawFile,
  );

  if (rawFile && typeof rawFile === "object") {
    console.log("📦 [getFileBuffer] rawFile keys:", Object.keys(rawFile));
    console.log(
      "📦 [getFileBuffer] rawFile value:",
      JSON.stringify(rawFile, null, 2),
    );
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
      console.log(
        "📦 [getFileBuffer] Stats - isDirectory:",
        stats.isDirectory(),
      );
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
    console.log(
      "📦 [getFileBuffer] About to read file with fs.promises.readFile...",
    );
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
      console.log(
        "🚀 [uploadFileHandler] Step 4: Converting file to buffer...",
      );

      const { buffer, name, type, size } = await getFileBuffer(rawFile);

      console.log("🚀 [uploadFileHandler] Step 4.1: Extracting file text...");
      let extractedText = "";
      let fileSummary = description || "";

      try {
        extractedText = await extractTextFromFile(buffer, name, type);
        console.log(
          "✅ [uploadFileHandler] Text extracted, length:",
          extractedText.length,
        );

        console.log("🚀 [uploadFileHandler] Step 4.2: Generating summary...");
        fileSummary = await generateSummary(extractedText);
        console.log("✅ [uploadFileHandler] Summary generated");
      } catch (summaryErr: any) {
        console.warn(
          "⚠️ [uploadFileHandler] Summary generation failed:",
          summaryErr.message,
        );
      }

      console.log("✅ [uploadFileHandler] File converted to buffer");
      console.log("📋 [uploadFileHandler] File name:", name);
      console.log("📋 [uploadFileHandler] File type:", type);
      console.log("📋 [uploadFileHandler] File size:", size);
      console.log("📋 [uploadFileHandler] Buffer length:", buffer.length);

      // Unique filename
      console.log(
        "🚀 [uploadFileHandler] Step 5: Generating unique filename...",
      );
      const uniqueName = `${randomUUID()}-${name}`;
      console.log("📋 [uploadFileHandler] Unique name:", uniqueName);

      // GCS Configuration Details
      console.log("☁️ [GCS] ===== GCS CONFIGURATION =====");
      console.log("☁️ [GCS] Bucket name:", bucketName);
      console.log(
        "☁️ [GCS] Storage instance type:",
        storage?.constructor?.name,
      );
      console.log("☁️ [GCS] Credentials path:", credentialsPath);

      console.log("☁️ [GCS] Bucket instance:", bucket?.name);
      console.log(
        "☁️ [GCS] Bucket exists check:",
        await bucket.exists().catch(() => false),
      );

      const blob = bucket.file(uniqueName);
      console.log("☁️ [GCS] Blob name:", blob.name);
      console.log("☁️ [GCS] Blob bucket:", blob.bucket?.name);
      console.log(
        "☁️ [GCS] Full GCS path: gs://" + bucketName + "/" + uniqueName,
      );
      console.log("✅ [uploadFileHandler] GCS blob created");

      // Upload file to GCS
      console.log("🚀 [uploadFileHandler] Step 6: Uploading to GCS...");
      console.log("☁️ [GCS] ===== UPLOAD DETAILS =====");
      console.log("☁️ [GCS] Upload method: blob.save()");
      console.log("☁️ [GCS] Buffer size:", buffer.length, "bytes");
      console.log("☁️ [GCS] Content type:", type);
      console.log("☁️ [GCS] Cache control: public, max-age=31536000");
      console.log(
        "☁️ [GCS] Upload options:",
        JSON.stringify(
          {
            contentType: type,
            metadata: {
              cacheControl: "public, max-age=31536000",
            },
          },
          null,
          2,
        ),
      );

      // Ensure buffer is a proper Node.js Buffer
      console.log("☁️ [GCS] Buffer type:", buffer.constructor.name);
      console.log(
        "☁️ [GCS] Buffer instanceof Buffer:",
        buffer instanceof Buffer,
      );
      console.log(
        "☁️ [GCS] Buffer instanceof Uint8Array:",
        buffer instanceof Uint8Array,
      );

      // Create a fresh Buffer to avoid any Bun-specific issues
      const nodeBuffer = Buffer.from(buffer);
      console.log(
        "☁️ [GCS] Created fresh Node Buffer, length:",
        nodeBuffer.length,
      );
      console.log("☁️ [GCS] Node Buffer type:", nodeBuffer.constructor.name);

      try {
        console.log(
          "☁️ [GCS] Starting upload with blob.save() using Node Buffer...",
        );
        // Try with explicit Buffer
        await blob.save(nodeBuffer, {
          contentType: type,
          metadata: {
            cacheControl: "public, max-age=31536000",
          },
        });
        console.log(
          "✅ [uploadFileHandler] File uploaded to GCS successfully using blob.save()",
        );

        // Get blob metadata after upload
        console.log("☁️ [GCS] ===== POST-UPLOAD METADATA =====");
        try {
          const [metadata] = await blob.getMetadata();
          console.log(
            "☁️ [GCS] Blob metadata:",
            JSON.stringify(
              {
                name: metadata.name,
                bucket: metadata.bucket,
                contentType: metadata.contentType,
                size: metadata.size,
                timeCreated: metadata.timeCreated,
                updated: metadata.updated,
                etag: metadata.etag,
                md5Hash: metadata.md5Hash,
                cacheControl: metadata.cacheControl,
                selfLink: metadata.selfLink,
                mediaLink: metadata.mediaLink,
              },
              null,
              2,
            ),
          );
        } catch (metaErr: any) {
          console.error("☁️ [GCS] Error getting metadata:", metaErr);
        }
      } catch (saveErr: any) {
        console.error(
          "❌ [uploadFileHandler] Error with blob.save():",
          saveErr,
        );
        console.error(
          "☁️ [GCS] Error details:",
          JSON.stringify(
            {
              code: saveErr.code,
              message: saveErr.message,
              name: saveErr.name,
              syscall: saveErr.syscall,
              errno: saveErr.errno,
              fd: saveErr.fd,
            },
            null,
            2,
          ),
        );
        console.error("❌ [uploadFileHandler] Trying alternative method...");

        // Alternative: Use file.save() with explicit options
        try {
          console.log(
            "☁️ [GCS] Alternative: Using file.save() with Uint8Array...",
          );
          const uint8Array = new Uint8Array(nodeBuffer);
          console.log(
            "☁️ [GCS] Created Uint8Array, length:",
            uint8Array.length,
          );

          await blob.save(uint8Array, {
            contentType: type,
            metadata: {
              cacheControl: "public, max-age=31536000",
            },
          });
          console.log(
            "✅ [uploadFileHandler] File uploaded using Uint8Array method",
          );
        } catch (uint8Err: any) {
          console.error(
            "❌ [uploadFileHandler] Error with Uint8Array method:",
            uint8Err,
          );
          console.error(
            "☁️ [GCS] Uint8Array error:",
            JSON.stringify(
              {
                code: uint8Err.code,
                message: uint8Err.message,
                syscall: uint8Err.syscall,
                errno: uint8Err.errno,
              },
              null,
              2,
            ),
          );

          // Final fallback: Use Readable.from() with explicit Node stream
          console.log(
            "☁️ [GCS] Final fallback: Using Readable.from() with createWriteStream...",
          );
          const stream = Readable.from(nodeBuffer);
          console.log("☁️ [GCS] Stream created from Node Buffer");

          await new Promise<void>((resolve, reject) => {
            const writeStreamOptions = {
              contentType: type,
              resumable: false,
              metadata: {
                cacheControl: "public, max-age=31536000",
              },
            };
            console.log(
              "☁️ [GCS] WriteStream options:",
              JSON.stringify(writeStreamOptions, null, 2),
            );

            const writeStream = blob.createWriteStream(writeStreamOptions);
            console.log("☁️ [GCS] WriteStream created");

            writeStream.on("error", (err) => {
              console.error(
                "❌ [uploadFileHandler] GCS upload error (fallback):",
                err,
              );
              console.error(
                "☁️ [GCS] WriteStream error details:",
                JSON.stringify(
                  {
                    code: err.code,
                    message: err.message,
                    name: err.name,
                    syscall: err.syscall,
                    errno: err.errno,
                    fd: err.fd,
                  },
                  null,
                  2,
                ),
              );
              reject(err);
            });

            writeStream.on("finish", () => {
              console.log(
                "✅ [uploadFileHandler] GCS upload finished (fallback)",
              );
              resolve();
            });

            console.log("☁️ [GCS] Piping stream to writeStream...");
            stream.pipe(writeStream);
          });
          console.log(
            "✅ [uploadFileHandler] File uploaded to GCS successfully (fallback)",
          );
        }
      }

      // ✅ Generate signed URL (instead of makePublic)
      console.log("🚀 [uploadFileHandler] Step 7: Generating signed URL...");
      console.log("☁️ [GCS] ===== SIGNED URL GENERATION =====");
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
      const expiresDate = new Date(expiresAt);
      console.log("☁️ [GCS] Expires at:", expiresDate.toISOString());
      console.log(
        "☁️ [GCS] Expires in:",
        Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)),
        "days",
      );

      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: expiresAt,
      });
      console.log("✅ [uploadFileHandler] Signed URL generated");
      console.log("☁️ [GCS] Signed URL length:", signedUrl.length);
      console.log(
        "☁️ [GCS] Signed URL (first 100 chars):",
        signedUrl.substring(0, 100) + "...",
      );
      console.log(
        "☁️ [GCS] Signed URL (last 50 chars):",
        "..." + signedUrl.substring(signedUrl.length - 50),
      );

      // Save record in DB
      console.log("🚀 [uploadFileHandler] Step 8: Saving to database...");
      const [record] = await db
        .insert(tables.files)
        .values({
          patientId,
          fileName: name,
          fileType: type,
          fileUrl: signedUrl,
          summary: fileSummary,
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
      console.error(
        "❌ [uploadFileHandler] Full error object:",
        JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
      );
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
