import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const driverFormSchema = z.object({
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  cedula: z.string().min(7, "Cédula debe tener al menos 7 dígitos"),
  telefono: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  licencia: z.string().min(5, "Número de licencia requerido"),
  fecha_vencimiento_licencia: z.string(),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
  experiencia_anos: z.number().min(0).max(50),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

// Mock data for demonstration
const mockDrivers = [
  {
    id: "1",
    nombre: "Carlos Mendoza",
    cedula: "12345678",
    telefono: "3001234567",
    email: "carlos.mendoza@email.com",
    licencia: "C1-123456",
    fecha_vencimiento_licencia: "2025-12-31",
    estado: "activo",
    experiencia_anos: 8,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "2",
    nombre: "María González",
    cedula: "87654321",
    telefono: "3009876543",
    email: "maria.gonzalez@email.com",
    licencia: "C1-654321",
    fecha_vencimiento_licencia: "2024-08-15",
    estado: "activo",
    experiencia_anos: 12,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "3",
    nombre: "José Ramírez",
    cedula: "11223344",
    telefono: "3001122334",
    email: "jose.ramirez@email.com",
    licencia: "C1-112233",
    fecha_vencimiento_licencia: "2024-03-20",
    estado: "suspendido",
    experiencia_anos: 5,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export function DriversManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      nombre: "",
      cedula: "",
      telefono: "",
      email: "",
      licencia: "",
      fecha_vencimiento_licencia: "",
      estado: "activo",
      experiencia_anos: 0,
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
      nombre: driver.nombre,
      cedula: driver.cedula,
      telefono: driver.telefono,
      email: driver.email || "",
      licencia: driver.licencia,
      fecha_vencimiento_licencia: driver.fecha_vencimiento_licencia,
      estado: driver.estado,
      experiencia_anos: driver.experiencia_anos,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-100 text-green-800";
      case "inactivo":
        return "bg-gray-100 text-gray-800";
      case "suspendido":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isLicenseExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiration <= 30;
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.cedula.includes(searchTerm) ||
    driver.telefono.includes(searchTerm)
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
                    name="nombre"
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
                    name="cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cédula</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de cédula" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefono"
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="licencia"
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
                  <FormField
                    control={form.control}
                    name="fecha_vencimiento_licencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimiento de Licencia</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="experiencia_anos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Años de Experiencia</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                            <SelectItem value="suspendido">Suspendido</SelectItem>
                          </SelectContent>
                        </Select>
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

      {/* Search and Stats */}
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
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {drivers.filter(d => d.estado === "activo").length}
              </div>
              <div className="text-sm text-slate-600">Conductores Activos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {drivers.filter(d => isLicenseExpiringSoon(d.fecha_vencimiento_licencia)).length}
              </div>
              <div className="text-sm text-slate-600">Licencias por Vencer</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(drivers.reduce((acc, d) => acc + d.experiencia_anos, 0) / drivers.length)}
              </div>
              <div className="text-sm text-slate-600">Años Promedio Exp.</div>
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
                <TableHead>Conductor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{driver.nombre}</div>
                      <div className="text-sm text-slate-500">CC: {driver.cedula}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1 text-slate-400" />
                        {driver.telefono}
                      </div>
                      {driver.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-slate-400" />
                          {driver.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{driver.licencia}</div>
                      <div className={`text-sm flex items-center ${
                        isLicenseExpiringSoon(driver.fecha_vencimiento_licencia) 
                          ? 'text-red-600' 
                          : 'text-slate-500'
                      }`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        Vence: {new Date(driver.fecha_vencimiento_licencia).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-slate-400" />
                      {driver.experiencia_anos} años
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(driver.estado)}>
                      {driver.estado.charAt(0).toUpperCase() + driver.estado.slice(1)}
                    </Badge>
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