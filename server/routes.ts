import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTripSchema, updateTripSchema } from "@shared/schema";
import { z } from "zod";

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
        const today = new Date();
        const tripDate = new Date(t.updated_at || t.created_at);
        return t.estado === "Completado" && 
               tripDate.toDateString() === today.toDateString();
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
      const trip = await storage.createTrip(validatedData);
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
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
