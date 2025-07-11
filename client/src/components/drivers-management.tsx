import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDriverSchema, type IDriver } from "@shared/schema";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

type DriverFormData = z.infer<typeof insertDriverSchema>;

// Extended interface for frontend display
interface Driver extends Omit<IDriver, '_id'> {
  id?: string;
  _id?: string;
}

export function DriversManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(insertDriverSchema),
    defaultValues: {
      name: "",
      license: "",
      phone: "",
    },
  });

  // Fetch drivers from API
  const { data: driversResponse, isLoading } = useQuery({
    queryKey: ['/api/drivers'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/drivers");
      return response.json();
    },
  });

  // Normalize drivers data
  const drivers: Driver[] = Array.isArray(driversResponse) ? driversResponse.map((driver: any) => ({
    ...driver,
    id: driver.id || driver._id,
  })) : [];

  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const response = await apiRequest("POST", "/api/drivers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Conductor creado",
        description: "El conductor ha sido registrado exitosamente",
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

  const updateDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      if (!editingDriver) throw new Error("No driver to update");
      const response = await apiRequest("PUT", `/api/drivers/${editingDriver.id || editingDriver._id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      setIsDialogOpen(false);
      setEditingDriver(null);
      form.reset();
      toast({
        title: "Conductor actualizado",
        description: "Los datos del conductor han sido actualizados",
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

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/drivers/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: "Conductor eliminado",
        description: "El conductor ha sido removido del sistema",
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

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    form.reset({
      name: driver.name,
      license: driver.license,
      phone: driver.phone,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: DriverFormData) => {
    if (editingDriver) {
      updateDriverMutation.mutate(data);
    } else {
      createDriverMutation.mutate(data);
    }
  };

  // TODO: Implement real-time updates using WebSockets or similar
  // For now, we will just filter the drivers based on the search term
  // This will be replaced with a more efficient solution later
  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesName = driver.name?.toLowerCase().includes(searchLower);
    const matchesLicense = driver.license?.toLowerCase().includes(searchLower);
    const matchesPhone = driver.phone?.includes(searchTerm);
    
    return matchesName || matchesLicense || matchesPhone;
  });

  // Debug log
  console.log('Search term:', searchTerm);
  console.log('Total drivers:', drivers.length);
  console.log('Filtered drivers:', filteredDrivers.length);
  console.log('Drivers data:', drivers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Conductores</h2>
          <p className="text-slate-600">Administra la información de los conductores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDriver(null);
              form.reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Conductor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDriver ? "Editar Conductor" : "Nuevo Conductor"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="license"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Licencia</FormLabel>
                        <FormControl>
                          <Input placeholder="C1-123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingDriver(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createDriverMutation.isPending || updateDriverMutation.isPending}
                  >
                    {(createDriverMutation.isPending || updateDriverMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingDriver ? "Actualizar" : "Crear"} Conductor
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-slate-400 transform -translate-y-1/2" />
              <Input
                placeholder="Buscar conductores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conductores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Cargando conductores...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-slate-500">
                        {searchTerm ? "No se encontraron conductores que coincidan con la búsqueda" : "No hay conductores registrados"}
                      </div>
                      {!searchTerm && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                            Crear primer conductor
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver.id || driver._id}>
                      <TableCell>
                        <div className="font-medium">{driver.name}</div>
                      </TableCell>
                      <TableCell>
                        <div>{driver.license}</div>
                      </TableCell>
                      <TableCell>
                        <div>{driver.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                            disabled={updateDriverMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDriverMutation.mutate(driver.id || driver._id || "")}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleteDriverMutation.isPending}
                          >
                            {deleteDriverMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}