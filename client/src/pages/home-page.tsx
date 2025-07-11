import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Truck, User, LogOut, Plus, Bell, Settings, BarChart3, Users, FileText } from "lucide-react";
import { StatsCards } from "@/components/stats-cards";
import { TripsTable } from "@/components/trips-table";
import { TripModal } from "@/components/trip-modal";
import { DriversManagement } from "@/components/drivers-management";
import { ReportsDashboard } from "@/components/reports-dashboard";
import { SettingsManagement } from "@/components/settings-management";
import { EnhancedTripsLogistics } from "@/components/enhanced-trips-logistics";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch full profile data
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/profile");
      return await response.json();
    },
    enabled: !!user,
  });
  
  // Initialize WebSocket connection for real-time updates
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };
  
  useWebSocket(addNotification);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex bg-slate-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg border-r border-slate-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center mr-3">
                <Truck className="text-white h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">FuelTrucks</span>
                <p className="text-xs text-slate-500">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <Button 
              variant={activeSection === "dashboard" ? "default" : "ghost"} 
              className="w-full justify-start h-12"
              onClick={() => setActiveSection("dashboard")}
            >
              <BarChart3 className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant={activeSection === "trips" ? "default" : "ghost"} 
              className="w-full justify-start h-12"
              onClick={() => setActiveSection("trips")}
            >
              <Truck className="mr-3 h-4 w-4" />
              Gestión de Viajes
            </Button>
            <Button 
              variant={activeSection === "drivers" ? "default" : "ghost"} 
              className="w-full justify-start h-12"
              onClick={() => setActiveSection("drivers")}
            >
              <Users className="mr-3 h-4 w-4" />
              Conductores
            </Button>
            <Button 
              variant={activeSection === "reports" ? "default" : "ghost"} 
              className="w-full justify-start h-12"
              onClick={() => setActiveSection("reports")}
            >
              <FileText className="mr-3 h-4 w-4" />
              Reportes
            </Button>
            <Button 
              variant={activeSection === "settings" ? "default" : "ghost"} 
              className="w-full justify-start h-12"
              onClick={() => setActiveSection("settings")}
            >
              <Settings className="mr-3 h-4 w-4" />
              Configuración
            </Button>
          </nav>

          {/* User Menu */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={profile?.profile?.photo?.url} 
                        alt={profile?.profile?.name || user?.username || "Profile"} 
                      />
                      <AvatarFallback>
                        {profile?.profile?.name 
                          ? getInitials(profile.profile.name)
                          : user?.username?.[0]?.toUpperCase() || "U"
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {profile?.profile?.name || user?.username}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.role === "admin" ? "Administrador del Sistema" : "Usuario"}
                      </p>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-1">
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => logoutMutation.mutate()}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-72 flex flex-col h-full flex-1">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {activeSection === "dashboard" ? "Dashboard" : 
               activeSection === "trips" ? "Gestión de Viajes" :
               activeSection === "drivers" ? "Conductores" :
               activeSection === "reports" ? "Reportes" : "Configuración"}
            </h1>
            <p className="text-sm text-slate-500">
              {activeSection === "dashboard" ? "Vista general del sistema" :
               activeSection === "trips" ? "Administra los viajes de camiones de combustible" :
               activeSection === "drivers" ? "Gestiona la información de conductores" :
               activeSection === "reports" ? "Reportes y análisis de datos" : "Configuración del sistema"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Notificaciones</h3>
                    {unreadNotifications > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                        Marcar todas como leídas
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            !notification.read ? 'bg-blue-500' : 'bg-slate-300'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                            <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-2">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {/* Add New Trip Button - Only show on dashboard and trips */}
            {(activeSection === "dashboard" || activeSection === "trips") && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Viaje
              </Button>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && (
            <>
              {/* Stats Cards */}
              <StatsCards />
              {/* Trips Table */}
              <TripsTable />
            </>
          )}
          
          {activeSection === "trips" && <EnhancedTripsLogistics />}
          
          {activeSection === "drivers" && <DriversManagement />}
          
          {activeSection === "reports" && <ReportsDashboard />}
          
          {activeSection === "settings" && <SettingsManagement />}
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
