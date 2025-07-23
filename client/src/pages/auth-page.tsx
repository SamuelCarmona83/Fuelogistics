import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// Cambiar el schema para permitir username o email
const loginUserSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Add a schema for the registration form that only requires username and password
  const registerUserSchema = z.object({
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: any) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: any) => {
    if (!data.username || !data.password) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    registerMutation.mutate(
      { ...data, role: "user" },
      {
        onError: (error: any) => {
          // Show a visible error message for registration failure
          alert(
            error?.message?.includes("Username already exists")
              ? "El usuario ya existe. Por favor, elige otro correo."
              : `Error al registrar: ${error.message}`
          );
        },
        onSuccess: () => {
          alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-6">
              <Truck className="text-white h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {activeTab === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <p className="text-slate-600">Sistema de Gestión de Camiones de Combustible</p>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="login" className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuario o Correo</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="admin o admin@email.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Iniciar Sesión
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuario o Correo</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Ej: admin o tu@email.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Crear Cuenta
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 bg-primary flex-col justify-center px-12 text-white">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">
            Gestión Eficiente de Flotas
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Controla y monitorea todos los viajes de tus camiones de combustible desde una plataforma centralizada.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-white rounded-full"></div>
              <span>Seguimiento en tiempo real</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-white rounded-full"></div>
              <span>Validación de reglas de negocio</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-white rounded-full"></div>
              <span>Reportes y análisis completos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
