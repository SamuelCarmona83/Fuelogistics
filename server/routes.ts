import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTripSchema, updateTripSchema, updateProfileSchema, insertDriverSchema, updateDriverSchema, systemConfigSchema, userPreferencesSchema, securitySettingsSchema } from "@shared/schema";
import { uploadFile, deleteFile, getFileUrl } from "./minio";
import { z } from "zod";
import multer from "multer";
import express from "express";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  },
});

// WebSocket connections store
const wsConnections = new Set<any>();

// Broadcast function to send updates to all connected clients
function broadcastUpdate(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  wsConnections.forEach(ws => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(message);
    }
  });
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Trip routes - all protected
  app.get("/api/viajes", requireAuth, async (req, res) => {
    try {
      const { search, status, fuelType, sortBy, sortOrder } = req.query;

      const trips = await storage.getTrips({
        search: search as string,
        status: status as string,
        fuelType: fuelType as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      // Calculate stats for dashboard
      const activeTrips = trips.filter(t => t.estado === "En tránsito").length;
      const completedToday = trips.filter(t => {
        if (t.estado !== "Completado") return false;
        const today = new Date();
        if (t.updated_at) {
          const tripDate = new Date(t.updated_at);
          return tripDate.toDateString() === today.toDateString();
        }
        if (t.created_at) {
          const tripDate = new Date(t.created_at);
          return tripDate.toDateString() === today.toDateString();
        }
        return false;
      }).length;
      const litersTransported = trips
        .filter(t => t.estado === "Completado")
        .reduce((sum, t) => sum + t.cantidad_litros, 0);
      const trucksInRoute = new Set(
        trips.filter(t => t.estado === "En tránsito").map(t => t.camion)
      ).size;

      res.json({
        trips,
        stats: {
          activeTrips,
          completedToday,
          litersTransported,
          trucksInRoute,
        }
      });
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/viajes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTripSchema.parse(req.body);

      // Convert fecha_salida string to Date object if it's a string
      if (typeof validatedData.fecha_salida === 'string') {
        validatedData.fecha_salida = new Date(validatedData.fecha_salida);
      }

      const trip = await storage.createTrip(validatedData);

      // Broadcast trip creation to all connected clients
      broadcastUpdate('TRIP_CREATED', trip);

      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/viajes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTripSchema.parse({ id, ...req.body });

      const trip = await storage.updateTrip(id, validatedData);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Broadcast trip update to all connected clients
      broadcastUpdate('TRIP_UPDATED', trip);

      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/viajes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTrip(id);

      // Broadcast trip deletion to all connected clients
      broadcastUpdate('TRIP_DELETED', { id });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Driver routes - all protected
  app.get("/api/drivers", requireAuth, async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/drivers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const driver = await storage.getDriverById(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/drivers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);

      // Broadcast driver creation to all connected clients
      broadcastUpdate('DRIVER_CREATED', driver);

      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/drivers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateDriverSchema.parse(req.body);
      const driver = await storage.updateDriver(id, validatedData);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      // Broadcast driver update to all connected clients
      broadcastUpdate('DRIVER_UPDATED', driver);

      res.json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/drivers/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDriver(id);

      // Broadcast driver deletion to all connected clients
      broadcastUpdate('DRIVER_DELETED', { id });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- ENDPOINTS DE CONFIGURACIÓN Y PREFERENCIAS ---
  // Configuración global del sistema
  app.get("/api/system-config", requireAuth, async (req, res) => {
    const config = await storage.getSystemConfig();
    res.json(config);
  });
  app.put("/api/system-config", requireAuth, async (req, res) => {
    try {
      const data = systemConfigSchema.parse(req.body);
      const config = await storage.saveSystemConfig(data);
      res.json(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message });
    }
  });

  // Preferencias de usuario (por usuario autenticado)
  app.get("/api/user-preferences", requireAuth, async (req, res) => {
    const userId = req.user && req.user._id ? String(req.user._id) : undefined;
    if (!userId) return res.status(400).json({ message: "No user id" });
    const prefs = await storage.getUserPreferences(userId);
    res.json(prefs);
  });
  app.put("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.user && req.user._id ? String(req.user._id) : undefined;
      if (!userId) return res.status(400).json({ message: "No user id" });
      const data = userPreferencesSchema.omit({ userId: true }).parse(req.body);
      const prefs = await storage.saveUserPreferences(userId, data);
      res.json(prefs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message });
    }
  });

  // Configuración de seguridad (global)
  app.get("/api/security-settings", requireAuth, async (req, res) => {
    const config = await storage.getSecuritySettings();
    res.json(config);
  });
  app.put("/api/security-settings", requireAuth, async (req, res) => {
    try {
      const data = securitySettingsSchema.parse(req.body);
      const config = await storage.saveSecuritySettings(data);
      res.json(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message });
    }
  });

  // --- SYSTEM STATS ENDPOINT ---
  app.get("/api/system-stats", requireAuth, async (req, res) => {
    try {
      // Uptime del proceso Node
      const uptime = Math.floor(process.uptime()); // segundos
      // Usuarios totales
      const { User } = await import("../shared/schema");
      const totalUsers = await User.countDocuments();
      // Conexiones activas (aprox. sesiones activas en Mongo)
      let activeConnections = 0;
      try {
        const mongooseMod = await import("mongoose");
        const db = mongooseMod.default.connection.db;
        if (db && typeof db.admin === 'function') {
          const admin = db.admin();
          const serverStatus = await admin.serverStatus();
          activeConnections = serverStatus.connections ? serverStatus.connections.current : 0;
        }
      } catch {
        activeConnections = 0;
      }
      // Tamaño de la base de datos (MB aprox)
      let databaseSize = '-';
      try {
        const mongooseMod = await import("mongoose");
        const db = mongooseMod.default.connection.db;
        if (db) {
          const stats = await db.stats();
          databaseSize = (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB';
        }
      } catch {
        databaseSize = '-';
      }
      // Último backup (no implementado, placeholder)
      const lastBackup = '-';
      // Uso de CPU y memoria (Node.js/os)
      const os = await import('os');
      const cpuUsage = (process.cpuUsage().system / 1e6).toFixed(2); // ms
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = (((totalMem - freeMem) / totalMem) * 100).toFixed(1); // %
      // Espacio en disco (aprox, solo Linux/Mac, usando 'os' y 'df -k')
      let diskUsage = '-';
      try {
        const { execSync } = await import('child_process');
        const df = execSync('df -k /').toString().split('\n')[1];
        const parts = df.trim().split(/\s+/);
        if (parts.length >= 5) {
          const used = parseInt(parts[2], 10);
          const total = parseInt(parts[1], 10);
          diskUsage = ((used / total) * 100).toFixed(1);
        }
      } catch {
        diskUsage = '-';
      }
      res.json({
        uptime,
        totalUsers,
        activeConnections,
        databaseSize,
        lastBackup,
        cpuUsage,
        memoryUsage,
        diskUsage,
      });
    } catch (error) {
      res.status(500).json({ message: "Error obteniendo estadísticas del sistema" });
    }
  });

  // --- ADMINISTRACIÓN DE USUARIOS ---
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password || !role) return res.status(400).json({ message: "Faltan campos obligatorios" });
      const { hashPassword } = await import("./auth");
      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed, role });
      res.status(201).json({ _id: user._id, username: user.username, role: user.role });
    } catch (error) {
      res.status(500).json({ message: "Error al crear usuario" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role } = req.body;
      let update: any = {};
      if (username) update.username = username;
      if (role) update.role = role;
      if (password) {
        const { hashPassword } = await import("./auth");
        update.password = await hashPassword(password);
      }
      const user = await storage.updateUser(id, update);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
      res.json({ _id: user._id, username: user.username, role: user.role });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar usuario" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.deleteUser(id);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar usuario" });
    }
  });

  // File upload routes
  app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileResult = await uploadFile(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        message: "File uploaded successfully",
        file: fileResult,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Error uploading file" });
    }
  });

  app.post("/api/upload/multiple", requireAuth, upload.array('files', 5), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = req.files.map(file =>
        uploadFile(file.originalname, file.buffer, file.mimetype)
      );

      const uploadResults = await Promise.all(uploadPromises);

      res.json({
        message: "Files uploaded successfully",
        files: uploadResults,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Error uploading files" });
    }
  });

  app.delete("/api/files/:fileName", requireAuth, async (req, res) => {
    try {
      const { fileName } = req.params;
      await deleteFile(fileName);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Error deleting file" });
    }
  });

  app.get("/api/files/:fileName/url", requireAuth, async (req, res) => {
    try {
      const { fileName } = req.params;
      const url = await getFileUrl(fileName);
      res.json({ url });
    } catch (error) {
      console.error("Error getting file URL:", error);
      res.status(500).json({ message: "Error getting file URL" });
    }
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!._id.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return profile data without password
      const { password, ...userWithoutPassword } = user.toObject();
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/register", express.json(), async (req, res) => {
    // registration logic here
  });

  app.post("/api/login", express.json(), async (req, res) => {
    // login logic here
  });

  app.put("/api/profile", express.json(), requireAuth, async (req, res) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const userId = req.user!._id.toString();

      const updatedUser = await storage.updateUserProfile(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return updated profile data without password
      const { password, ...userWithoutPassword } = updatedUser.toObject();
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/profile/photo", requireAuth, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "Only image files are allowed for profile photos" });
      }
      const fileResult = await uploadFile(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype
      );
      const userId = req.user!._id.toString();
      const photoData = {
        fileName: fileResult.fileName,
        originalName: fileResult.originalName,
        url: fileResult.url,
        uploadedAt: new Date(),
      };
      const updatedUser = await storage.updateUserProfilePhoto(userId, photoData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser.toObject();
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Error uploading profile photo" });
    }
  });

  app.delete("/api/profile/photo", requireAuth, async (req, res) => {
    try {
      const userId = req.user!._id.toString();
      const user = await storage.getUserById(userId);
      if (!user || !user.profile?.photo) {
        return res.status(404).json({ message: "Profile photo not found" });
      }
      try {
        await deleteFile(user.profile.photo.fileName);
      } catch (error) {
        console.warn("Error deleting file from MinIO:", error);
      }
      const updatedUser = await storage.removeUserProfilePhoto(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser.toObject();
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      res.status(500).json({ message: "Error deleting profile photo" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server on a different path to avoid conflicts with Vite
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws'
  });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    wsConnections.add(ws);

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      wsConnections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  return httpServer;
}
