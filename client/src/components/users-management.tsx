import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function UsersManagement() {
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return res.json();
    },
  });

  // Create user
  const createUser = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const res = await apiRequest("POST", "/api/users", data);
      if (!res.ok) throw new Error("Error al crear usuario");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setNewUser({ username: "", password: "", role: "user" });
      toast({ title: "Usuario creado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Update user
  const updateUser = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      if (!res.ok) throw new Error("Error al actualizar usuario");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditing(null);
      toast({ title: "Usuario actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      if (!res.ok) throw new Error("Error al eliminar usuario");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuario eliminado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Extract table body rendering to fix nested ternary complexity
  const renderUsernameCell = (user: any) => {
    if (editing === user._id) {
      return <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />;
    }
    return user.username;
  };

  const renderRoleCell = (user: any) => {
    if (editing === user._id) {
      return (
        <Select value={form.role} onValueChange={role => setForm(f => ({ ...f, role }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    return user.role;
  };

  const renderActionsCell = (user: any) => {
    if (editing === user._id) {
      return (
        <>
          <Input placeholder="Nueva contraseña (opcional)" type="password" value={form.password ?? ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          <Button size="sm" onClick={() => updateUser.mutate({ id: user._id, ...form })}>Guardar</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
        </>
      );
    }
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => { setEditing(user._id); setForm({ username: user.username, role: user.role, password: "" }); }}>Editar</Button>
        <Button size="sm" variant="destructive" onClick={() => deleteUser.mutate(user._id)}>Eliminar</Button>
      </>
    );
  };

const renderTableBody = () => {
    if (isLoading) {
      return <TableRow><TableCell colSpan={3}>Cargando...</TableCell></TableRow>;
    }
    
    if (!users?.length) {
      return <TableRow><TableCell colSpan={3}>Sin usuarios</TableCell></TableRow>;
    }
    
    return users.map((u: any) => (
      <TableRow key={u._id}>
        <TableCell>{renderUsernameCell(u)}</TableCell>
        <TableCell>{renderRoleCell(u)}</TableCell>
        <TableCell className="flex gap-2">{renderActionsCell(u)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración de Usuarios</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Crear nuevo usuario */}
        <div className="flex gap-2 mb-6">
          <Input placeholder="Usuario" value={newUser.username} onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))} />
          <Input placeholder="Contraseña" type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
          <Select value={newUser.role} onValueChange={role => setNewUser(u => ({ ...u, role }))}>
            <SelectTrigger><SelectValue placeholder="Rol" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">Usuario</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => createUser.mutate(newUser)}>Crear</Button>
        </div>
        {/* Tabla de usuarios */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableBody()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
