import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTripSchema, updateTripSchema, insertDriverSchema, updateDriverSchema, systemConfigSchema, userPreferencesSchema, securitySettingsSchema } from "@shared/schema";
import { z } from "zod";

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
