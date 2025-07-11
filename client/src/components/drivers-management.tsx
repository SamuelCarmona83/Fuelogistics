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
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const driverFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  license: z.string().min(5, "Número de licencia requerido"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

// Mock data for demonstration
const mockDrivers = [
  {
    id: "1",
    name: "Carlos Mendoza",
    license: "C1-123456",
    phone: "3001234567",
    created_at: new Date(),
    updated_at: new Date(),
  }
];

export function DriversManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      license: "",
      phone: "",
    },
  });

  // Using mock data for now - in real implementation this would fetch from API
  const { data: drivers = mockDrivers, isLoading } = useQuery({
    queryKey: ['/api/drivers'],
    queryFn: () => Promise.resolve(mockDrivers),
  });

  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const newDriver = {
        ...data,
        id: Date.now().toString(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      return newDriver;
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
  });

  const updateDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      return { ...editingDriver, ...data, updated_at: new Date() };
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
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: "Conductor eliminado",
        description: "El conductor ha sido removido del sistema",
      });
    },
  });

  const handleEdit = (driver: any) => {
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

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

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
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDriverMutation.mutate(driver.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}