import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTripSchema, updateTripSchema, Trip, type IDriver } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Plus } from "lucide-react";
import { z } from "zod";
import { useState } from "react";

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip | null;
}

// Create a schema for the form that handles the datetime-local input
const formSchema = insertTripSchema.extend({
  fecha_salida: z.string().min(1, "Fecha de salida es requerida"),
});

type FormData = z.infer<typeof formSchema>;

export function TripModal({ isOpen, onClose, trip }: TripModalProps) {
  const { toast } = useToast();
  const isEditing = !!trip;
  const [showDriverForm, setShowDriverForm] = useState(false);

  // Fetch drivers for the selector
  const { data: driversResponse } = useQuery({
    queryKey: ['/api/drivers'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/drivers");
      return response.json();
    },
  });

  // Normalize drivers data
  const drivers: Array<IDriver & { id?: string; _id?: string }> = Array.isArray(driversResponse) 
    ? driversResponse 
    : [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      camion: trip?.camion || "",
      conductor: trip?.conductor || "",
      origen: trip?.origen || "",
      destino: trip?.destino || "",
      combustible: trip?.combustible || "",
      cantidad_litros: trip?.cantidad_litros || 0,
      fecha_salida: trip?.fecha_salida 
        ? new Date(trip.fecha_salida).toISOString().slice(0, 16)
        : "",
      estado: trip?.estado || "En tránsito",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Convert datetime-local string to ISO string
      const payload = {
        ...data,
        fecha_salida: new Date(data.fecha_salida).toISOString(),
      };
      
      const response = await apiRequest("POST", "/api/viajes", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viajes"] });
      toast({
        title: "Viaje creado",
        description: "El viaje ha sido creado exitosamente.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!trip) throw new Error("No trip to update");
      
      // Convert datetime-local string to ISO string
      const payload = {
        ...data,
        fecha_salida: new Date(data.fecha_salida).toISOString(),
      };
      
      const response = await apiRequest("PUT", `/api/viajes/${trip.id || trip._id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viajes"] });
      toast({
        title: "Viaje actualizado",
        description: "El viaje ha sido actualizado exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Validate that the departure date is not in the past
    const departureDate = new Date(data.fecha_salida);
    const now = new Date();
    
    if (departureDate <= now) {
      form.setError("fecha_salida", {
        message: "La fecha de salida no puede ser en el pasado",
      });
      return;
    }

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Viaje" : "Crear Nuevo Viaje"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los detalles del viaje seleccionado." 
              : "Completa la información para crear un nuevo viaje."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="camion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camión *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: ABC123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conductor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conductor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar conductor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.length === 0 ? (
                          <div className="p-2">
                            <div className="text-sm text-slate-500 mb-2">
                              No hay conductores registrados
                            </div>
                            <div className="text-xs text-slate-400">
                              Ve a la sección "Gestión de Conductores" para agregar conductores
                            </div>
                          </div>
                        ) : (
                          drivers.map((driver) => (
                            <SelectItem 
                              key={driver.id || driver._id} 
                              value={driver.name}
                            >
                              {driver.name} - {driver.license}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Planta Norte">Planta Norte</SelectItem>
                        <SelectItem value="Planta Sur">Planta Sur</SelectItem>
                        <SelectItem value="Planta Este">Planta Este</SelectItem>
                        <SelectItem value="Planta Oeste">Planta Oeste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Estación Centro">Estación Centro</SelectItem>
                        <SelectItem value="Estación Norte">Estación Norte</SelectItem>
                        <SelectItem value="Estación Sur">Estación Sur</SelectItem>
                        <SelectItem value="Estación Este">Estación Este</SelectItem>
                        <SelectItem value="Estación Oeste">Estación Oeste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="combustible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustible *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar combustible" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Diésel">Diésel</SelectItem>
                        <SelectItem value="Gasolina">Gasolina</SelectItem>
                        <SelectItem value="Gas Natural">Gas Natural</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cantidad_litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad (Litros) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="30000"
                        placeholder="Máximo 30,000 litros"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">Máximo permitido: 30,000 litros</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_salida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha y Hora de Salida *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">No se permiten fechas pasadas</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="En tránsito">En tránsito</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Actualizar Viaje" : "Crear Viaje"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
