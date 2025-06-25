import app from "@/app";
import { env } from "@/env";
import { registerRoutes } from "@/routes";
import { swaggerUI } from "@hono/swagger-ui";
import { serve } from "bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const allowedOrigins = [
  "http://localhost:3000",
  "https://core-server-development-1036152259123.asia-southeast1.run.app",
];

// // // ✅ Only register CORS **once**, and do it before any routes
// app.use(
//   '*',
//   cors({
//     origin: (origin) => {
//       if (!origin) return ''; // For non-browser requests like curl
//       return allowedOrigins.includes(origin) ? origin : '';
//     },
//     allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// 		allowHeaders: ['*'],
//     // credentials: true, // If you're sending cookies or auth headers
//     maxAge: 600,

//   })
// )

// app.use(async (c, next) => {
//   const corsMiddleware = cors({
//     origin: 'http://localhost:3000',
//     allowHeaders: ['Origin', 'Content-Type', 'Authorization'],
//     allowMethods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
//     credentials: true,
// 		exposeHeaders: ["Content-Length"], // 暴露的 headers
//   })
//   await corsMiddleware(c, next)
// })
app.use(logger());

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://core-server-development-1036152259123.asia-southeast1.run.app",
        "https://awaaz-e-sehat-admin-1036152259123.asia-southeast1.run.app",
      ];
      return allowedOrigins.includes(origin ?? "") ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
