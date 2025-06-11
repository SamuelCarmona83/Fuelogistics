import express from "express";
import { registerRoutes } from "./routes";
import { connectToMongoDB } from "./db";
import { setupVite } from "./vite";
import { log } from "./static";

(async () => {
    await connectToMongoDB();
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    const server = await registerRoutes(app);
    await setupVite(app, server);
    const port = 5001;
    server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
    }, () => {
        log(`serving (dev) on port ${port}`);
    });
})();
