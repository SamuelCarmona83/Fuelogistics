import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTripSchema, updateTripSchema, updateProfileSchema } from "@shared/schema";
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
      const user = await storage.getUserById((req.user as any)._id.toString());
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
      const userId = (req.user as any)._id.toString();
      
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
      const userId = (req.user as any)._id.toString();
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
      const userId = (req.user as any)._id.toString();
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
