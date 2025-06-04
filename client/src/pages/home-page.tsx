import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Truck, User, LogOut, Plus, Bell, Search, X } from "lucide-react";
import { StatsCards } from "@/components/stats-cards";
import { FilterBar } from "@/components/filter-bar";
import { TripsTable } from "@/components/trips-table";
import { TripModal } from "@/components/trip-modal";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize WebSocket connection for real-time updates
  useWebSocket();

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-slate-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Truck className="text-white h-4 w-4" />
              </div>
              <span className="text-lg font-semibold text-slate-900">FuelTrucks</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Button variant="default" className="w-full justify-start">
              <span className="mr-3">📊</span>
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <span className="mr-3">🚛</span>
              Viajes
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <span className="mr-3">👥</span>
              Conductores
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <span className="mr-3">🚚</span>
              Camiones
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <span className="mr-3">📈</span>
              Reportes
            </Button>
          </nav>

          {/* User Menu */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-slate-300 rounded-full flex items-center justify-center mr-3">
                <User className="text-slate-600 h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="text-slate-400 hover:text-slate-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex flex-col h-full flex-1">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Gestión de Viajes</h1>
            <p className="text-sm text-slate-500">Administra los viajes de camiones de combustible</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            {/* Add New Trip Button */}
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Viaje
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <StatsCards />

          {/* Filters and Search */}
          <FilterBar />

          {/* Trips Table */}
          <TripsTable />
        </main>
      </div>

      {/* Trip Modal */}
      <TripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
