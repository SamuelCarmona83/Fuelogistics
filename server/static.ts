import express, { type Express } from "express";
import path from "path";
import fs from "fs";

// This file is now only for production static serving and logging.
// No Vite/dev-server logic should be here.
export function serveStatic(app: Express) {
    const distPath = path.resolve(import.meta.dirname, "public");
    if (!fs.existsSync(distPath)) {
        throw new Error(
            `Could not find the build directory: ${distPath}, make sure to build the client first`,
        );
    }
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
