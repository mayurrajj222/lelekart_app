import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import searchApiRouter from "./searchApi";
import { scheduleDailyBackup } from "./services/scheduler-service";
import dotenv from "dotenv";
dotenv.config();
const app = express();
// Increase JSON payload limit to 100MB for large payloads
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware to support mobile app requests
app.use((req, res, next) => {
  // Allow requests from any origin for API endpoints
  if (req.path.startsWith("/api/")) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add a health check endpoint for deployments
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Add root path handler for deployment health checks
  app.get("/", (req, res, next) => {
    // Only handle direct requests to root, not client-side routes
    if (req.headers.accept?.includes("text/html")) {
      return next(); // Let Vite handle HTML requests
    }
    res.status(200).json({ status: "ok" });
  });

  // Register our dedicated search API router before all other routes
  app.use(searchApiRouter);

  const server = await registerRoutes(app);

  // Catch-all 404 handler for unhandled requests (after all routes, before error handler)
  app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
      // Let Vite/static handler serve index.html for SPA routes
      return next();
    }
    res.status(404).json({ message: "Not Found" });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // IMPORTANT: For Replit workflows, default to port 5000 in development
  // In production, use the PORT environment variable
  const port = process.env.PORT || 5000;

  // Trust the proxy headers for deployments
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
    console.log(`Running in production mode on port ${port}`);
  }

  console.log(
    `Starting server in ${
      process.env.NODE_ENV || "development"
    } mode on port ${port}`
  );

  server.listen(
    {
      port: parseInt(port.toString()),
      host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
    },
    () => {
      log(`serving on port ${port}`);
      console.log(
        `Server is running on http://${
          process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"
        }:${port}`
      );

      // Initialize daily database backup at midnight
      scheduleDailyBackup(0, 0);
    }
  );

  // Set a longer timeout for the server to handle large file uploads
  server.setTimeout(120000); // 120 seconds
})();
