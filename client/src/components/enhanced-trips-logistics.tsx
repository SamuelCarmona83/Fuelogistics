import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Clock, 
  Fuel, 
  Truck, 
  User, 
  Calendar,
  Route,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  Filter,
  Search,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function EnhancedTripsLogistics() {
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fecha_salida");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");
  const { toast } = useToast();

  // Fetch trips data with enhanced filtering
  const { data: tripsResponse, isLoading } = useQuery({
    queryKey: ['/api/viajes', { search: searchTerm, status: statusFilter, sortBy, sortOrder }],
    refetchInterval: 10000, // Auto-refresh every 10 seconds for real-time updates
  });

  // Normalize trip IDs so all trips have an 'id' property
  const tripsRaw = Array.isArray((tripsResponse as any)?.trips) ? (tripsResponse as any).trips : [];
  const trips = tripsRaw.map((trip: any) => ({
    ...trip,
    id: trip.id || trip._id,
  }));

  // Status update mutations
  const updateTripStatusMutation = useMutation({
    mutationFn: async ({ tripId, newStatus }: { tripId: string, newStatus: string }) => {
      const response = await apiRequest("PUT", `/api/viajes/${tripId}`, { estado: newStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/viajes'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del viaje ha sido actualizado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter trips based on active tab and filters
  const filteredTrips = trips.filter((trip: any) => {
    const matchesSearch = !searchTerm || 
      trip.conductor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.camion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destino.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || trip.estado === statusFilter;

    const matchesTab = activeTab === "all" || 
      (activeTab === "active" && trip.estado === "En tránsito") ||
      (activeTab === "completed" && trip.estado === "Completado") ||
      (activeTab === "cancelled" && trip.estado === "Cancelado");

    return matchesSearch && matchesStatus && matchesTab;
  });

  // Sort trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "En tránsito":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "Completado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Cancelado":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En tránsito":
        return "bg-blue-100 text-blue-800";
      case "Completado":
        return "bg-green-100 text-green-800";
      case "Cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case "Diesel":
      case "Diesel Premium":
        return "bg-yellow-100 text-yellow-800";
      case "Gasolina Regular":
        return "bg-blue-100 text-blue-800";
      case "Gasolina Premium":
        return "bg-purple-100 text-purple-800";
      case "Gas Natural":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate progress for active trips (mock calculation based on time)
  const calculateProgress = (trip: any) => {
    if (trip.estado !== "En tránsito") return 0;
    
    const startTime = new Date(trip.fecha_salida).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    const estimatedDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
    return Math.min(Math.max((elapsed / estimatedDuration) * 100, 0), 100);
  };

  const exportTripsData = () => {
    const exportData = {
      trips: sortedTrips,
      filters: { search: searchTerm, status: statusFilter, sortBy, sortOrder },
      exportedAt: new Date().toISOString(),
      totalTrips: sortedTrips.length,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viajes-logistica-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Statistics
  const stats = {
    total: trips.length,
    active: trips.filter((t: any) => t.estado === "En tránsito").length,
    completed: trips.filter((t: any) => t.estado === "Completado").length,
    cancelled: trips.filter((t: any) => t.estado === "Cancelado").length,
    totalVolume: trips.reduce((sum: number, trip: any) => sum + trip.cantidad_litros, 0),
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Viajes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">En Tránsito</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Completados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Fuel className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Volumen Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {typeof stats.totalVolume === "number" && !isNaN(stats.totalVolume)
                    ? (stats.totalVolume / 1000).toFixed(1) + "K L"
                    : "0K L"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-slate-400 transform -translate-y-1/2" />
                <Input
                  placeholder="Buscar viajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="En tránsito">En Tránsito</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha_salida">Fecha de Salida</SelectItem>
                  <SelectItem value="conductor">Conductor</SelectItem>
                  <SelectItem value="destino">Destino</SelectItem>
                  <SelectItem value="cantidad_litros">Cantidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportTripsData}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Trips Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Logística de Viajes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Activos ({stats.active})</TabsTrigger>
              <TabsTrigger value="completed">Completados ({stats.completed})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados ({stats.cancelled})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Viaje</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Combustible</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTrips.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{trip.camion}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-500">
                            <User className="h-3 w-3" />
                            <span>{trip.conductor}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(trip.fecha_salida), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="truncate max-w-32">{trip.origen}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span className="truncate max-w-32">{trip.destino}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getFuelTypeColor(trip.combustible)}>
                            {trip.combustible}
                          </Badge>
                          <div className="text-sm text-slate-500">
                            { trip.cantidad_litros && typeof trip.cantidad_litros === "number" && !isNaN(trip.cantidad_litros)
                              ? trip.cantidad_litros.toLocaleString()
                              : "0"} L
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {trip.estado === "En tránsito" ? (
                          <div className="space-y-2">
                            <Progress value={calculateProgress(trip)} className="w-24" />
                            <div className="text-xs text-slate-500">
                              {Math.round(calculateProgress(trip))}% completado
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">
                            {trip.estado === "Completado" ? "100%" : "0%"}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(trip.estado)}
                          <Badge className={getStatusColor(trip.estado)}>
                            {trip.estado}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-1">
                          {trip.estado === "En tránsito" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTripStatusMutation.mutate({
                                  tripId: trip.id,
                                  newStatus: "Completado"
                                })}
                                disabled={updateTripStatusMutation.isPending}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTripStatusMutation.mutate({
                                  tripId: trip.id,
                                  newStatus: "Cancelado"
                                })}
                                disabled={updateTripStatusMutation.isPending}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {sortedTrips.length === 0 && (
                <div className="text-center py-12">
                  <Truck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No hay viajes</h3>
                  <p className="text-slate-500">No se encontraron viajes con los filtros aplicados</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}