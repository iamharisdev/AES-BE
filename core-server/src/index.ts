import app from "@/app";
import { env } from "@/env";
import { registerRoutes } from "@/routes";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

app.use(logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://core-server-development-1036152259123.asia-southeast1.run.app",
        "https://awaaz-e-sehat-admin-1036152259123.asia-southeast1.run.app",
        "https://app.awaazesehat.com",
        "https://aes-admin-1036152259123.us-central1.run.app",
        "ngrok-free.app",
      ];

      if (!origin) return ""; // for server-to-server calls

      return allowedOrigins.includes(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// 👇 very important for preflight support
app.options("*", (c) => c.text("", 204));

// ✅ Now register routes AFTER middleware
registerRoutes();

// Swagger setup
app.doc("/docs.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Awaaz Sehat API",
  },
});

app.openAPIRegistry.registerComponent("securitySchemes", "jwt", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.get("/docs", swaggerUI({ url: "/docs.json" }));

console.log(`app running on http://127.0.0.1:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
