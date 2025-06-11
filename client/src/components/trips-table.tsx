import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, User, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { FilterBar } from "./filter-bar";
import { TripModal } from "./trip-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "@shared/schema";

export function TripsTable() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    fuelType: "",
    sortBy: "fecha_salida",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<{ trips: Trip[]; stats: any }>({
    queryKey: ["/api/viajes", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/viajes?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }
      
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await apiRequest("DELETE", `/api/viajes/${tripId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viajes"] });
      toast({
        title: "Viaje cancelado",
        description: "El viaje ha sido cancelado exitosamente.",
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

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "En tránsito":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">En tránsito</Badge>;
      case "Completado":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Completado</Badge>;
      case "Cancelado":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === "asc" ? 
      <ChevronUp className="ml-1 h-3 w-3" /> : 
      <ChevronDown className="ml-1 h-3 w-3" />;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Error al cargar los viajes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <FilterBar onFiltersChange={setFilters} />
      
      <Card>
        <CardHeader>
          <CardTitle>Viajes Recientes</CardTitle>
          <CardDescription>Lista de todos los viajes de combustible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort("conductor")}
                  >
                    <div className="flex items-center">
                      Conductor
                      <SortIcon field="conductor" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort("camion")}
                  >
                    <div className="flex items-center">
                      Camión
                      <SortIcon field="camion" />
                    </div>
                  </TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort("combustible")}
                  >
                    <div className="flex items-center">
                      Combustible
                      <SortIcon field="combustible" />
                    </div>
                  </TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort("fecha_salida")}
                  >
                    <div className="flex items-center">
                      Fecha Salida
                      <SortIcon field="fecha_salida" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => handleSort("estado")}
                  >
                    <div className="flex items-center">
                      Estado
                      <SortIcon field="estado" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-slate-500">No se encontraron viajes</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.trips.map((trip) => (
                    <TableRow key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center mr-3">
                            <User className="text-slate-600 h-4 w-4" />
                          </div>
                          <span className="font-medium">{trip.conductor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{trip.camion}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{trip.origen}</div>
                          <div className="text-sm text-slate-500 flex items-center">
                            <ArrowRight className="mx-1 h-3 w-3" />
                            {trip.destino}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{trip && trip.combustible}</TableCell>
                      <TableCell>{trip.cantidad_litros && trip.cantidad_litros?.toLocaleString()} L</TableCell>
                      <TableCell>
                        {new Date(trip.fecha_salida).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(trip.estado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTrip(trip)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar viaje</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro que deseas cancelar este viaje? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(trip.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingTrip && (
        <TripModal
          isOpen={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          trip={editingTrip}
        />
      )}
    </>
  );
}
