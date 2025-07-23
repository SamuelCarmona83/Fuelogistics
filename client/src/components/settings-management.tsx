import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings, 
  User, 
  Database, 
  Save,
  RefreshCw,
  AlertTriangle,
  Users,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type React from "react";

export function SettingsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // --- CARGA DE DATOS DESDE EL BACKEND ---
  // Configuración del sistema
  const { data: systemConfigData } = useQuery({
    queryKey: ["/api/system-config"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/system-config");
      return res.json();
    },
  });
  // Preferencias de usuario
  const { data: userPreferencesData } = useQuery({
    queryKey: ["/api/user-preferences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-preferences");
      return res.json();
    },
    enabled: !!user,
  });
  // Configuración de seguridad
  const { data: securitySettingsData } = useQuery({
    queryKey: ["/api/security-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/security-settings");
      return res.json();
    },
  });
  // Estadísticas del sistema
  const { data: systemStats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/system-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/system-stats");
      return res.json();
    },
    refetchInterval: 5000, // Actualiza cada 5 segundos
  });

  // Estados locales sincronizados con backend
  const [systemConfig, setSystemConfig] = useState({
    maxFuelCapacity: 30000,
    autoRefreshInterval: 30,
    maxConcurrentTrips: 100,
    defaultFuelType: "Diesel",
    timezone: "America/Bogota",
    language: "es",
    enableNotifications: true,
    enableRealTimeUpdates: true,
    enableEmailAlerts: false,
    maintenanceMode: false,
  });
  const [userPreferences, setUserPreferences] = useState({
    theme: "light",
    dashboardRefresh: true,
    soundAlerts: false,
    emailNotifications: true,
    smsNotifications: false,
    defaultView: "dashboard",
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 480,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    auditLogging: true,
  });

  // Sincronizar estados locales cuando llegan los datos del backend
  useEffect(() => {
    if (systemConfigData) setSystemConfig(systemConfigData);
  }, [systemConfigData]);
  useEffect(() => {
    if (userPreferencesData) setUserPreferences({ ...userPreferencesData, userId: undefined });
  }, [userPreferencesData]);
  useEffect(() => {
    if (securitySettingsData) setSecuritySettings(securitySettingsData);
  }, [securitySettingsData]);

  // --- MUTACIONES PARA GUARDAR ---
  const saveSystemConfigMutation = useMutation({
    mutationFn: async (data: typeof systemConfig) => {
      const res = await apiRequest("PUT", "/api/system-config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-config"] });
      toast({
        title: "Configuración guardada",
        description: "La configuración del sistema ha sido actualizada",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });
  const saveUserPreferencesMutation = useMutation({
    mutationFn: async (data: typeof userPreferences) => {
      const res = await apiRequest("PUT", "/api/user-preferences", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({
        title: "Preferencias guardadas",
        description: "Tus preferencias han sido actualizadas",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });
  const saveSecuritySettingsMutation = useMutation({
    mutationFn: async (data: typeof securitySettings) => {
      const res = await apiRequest("PUT", "/api/security-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-settings"] });
      toast({
        title: "Seguridad guardada",
        description: "La configuración de seguridad ha sido actualizada",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  // Handlers para guardar
  function handleSaveSystemConfig() {
    setIsLoading(true);
    saveSystemConfigMutation.mutate(systemConfig, {
      onSettled: () => setIsLoading(false),
    });
  }
  function handleSaveUserPreferences() {
    setIsLoading(true);
    saveUserPreferencesMutation.mutate(userPreferences, {
      onSettled: () => setIsLoading(false),
    });
  }
  function handleSaveSecuritySettings() {
    setIsLoading(true);
    saveSecuritySettingsMutation.mutate(securitySettings, {
      onSettled: () => setIsLoading(false),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h2>
        <p className="text-slate-600">Administra la configuración global del sistema y preferencias de usuario</p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tiempo Activo</p>
                <p className="text-lg font-semibold">{loadingStats ? '...' : systemStats?.uptime ?? '-'}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Usuarios Activos</p>
                <p className="text-lg font-semibold">{loadingStats ? '...' : `${systemStats?.activeConnections ?? '-'} / ${systemStats?.totalUsers ?? '-'}`}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Base de Datos</p>
                <p className="text-lg font-semibold">{loadingStats ? '...' : systemStats?.databaseSize ?? '-'}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Uso de CPU</p>
                <p className="text-lg font-semibold">{loadingStats ? '...' : `${systemStats?.cpuUsage ?? '-'}%`}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Configuración del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxFuelCapacity">Capacidad Máxima de Combustible (L)</Label>
                <Input
                  id="maxFuelCapacity"
                  type="number"
                  value={systemConfig.maxFuelCapacity}
                  onChange={(e) => setSystemConfig(prev => ({
                    ...prev,
                    maxFuelCapacity: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="autoRefresh">Intervalo de Actualización (seg)</Label>
                <Input
                  id="autoRefresh"
                  type="number"
                  value={systemConfig.autoRefreshInterval}
                  onChange={(e) => setSystemConfig(prev => ({
                    ...prev,
                    autoRefreshInterval: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultFuelType">Tipo de Combustible por Defecto</Label>
                <Select
                  value={systemConfig.defaultFuelType}
                  onValueChange={(value) => setSystemConfig(prev => ({
                    ...prev,
                    defaultFuelType: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Gasolina Regular">Gasolina Regular</SelectItem>
                    <SelectItem value="Gasolina Premium">Gasolina Premium</SelectItem>
                    <SelectItem value="Gas Natural">Gas Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select
                  value={systemConfig.timezone}
                  onValueChange={(value) => setSystemConfig(prev => ({
                    ...prev,
                    timezone: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                    <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                    <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notificaciones en Tiempo Real</Label>
                <Switch
                  id="notifications"
                  checked={systemConfig.enableNotifications}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({
                    ...prev,
                    enableNotifications: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="realTimeUpdates">Actualizaciones en Tiempo Real</Label>
                <Switch
                  id="realTimeUpdates"
                  checked={systemConfig.enableRealTimeUpdates}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({
                    ...prev,
                    enableRealTimeUpdates: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenanceMode" className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                  Modo Mantenimiento
                </Label>
                <Switch
                  id="maintenanceMode"
                  checked={systemConfig.maintenanceMode}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({
                    ...prev,
                    maintenanceMode: checked
                  }))}
                />
              </div>
            </div>

            <Button onClick={handleSaveSystemConfig} disabled={isLoading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Preferencias de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Tema de la Aplicación</Label>
              <Select
                value={userPreferences.theme}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  theme: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultView">Vista por Defecto</Label>
              <Select
                value={userPreferences.defaultView}
                onValueChange={(value) => setUserPreferences(prev => ({
                  ...prev,
                  defaultView: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="trips">Gestión de Viajes</SelectItem>
                  <SelectItem value="drivers">Conductores</SelectItem>
                  <SelectItem value="reports">Reportes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="dashboardRefresh">Auto-actualizar Dashboard</Label>
                <Switch
                  id="dashboardRefresh"
                  checked={userPreferences.dashboardRefresh}
                  onCheckedChange={(checked) => setUserPreferences(prev => ({
                    ...prev,
                    dashboardRefresh: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="soundAlerts">Alertas de Sonido</Label>
                <Switch
                  id="soundAlerts"
                  checked={userPreferences.soundAlerts}
                  onCheckedChange={(checked) => setUserPreferences(prev => ({
                    ...prev,
                    soundAlerts: checked
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                <Switch
                  id="emailNotifications"
                  checked={userPreferences.emailNotifications}
                  onCheckedChange={(checked) => setUserPreferences(prev => ({
                    ...prev,
                    emailNotifications: checked
                  }))}
                />
              </div>
            </div>

            <Button onClick={handleSaveUserPreferences} disabled={isLoading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Preferencias"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Configuración de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="passwordExpiry">Expiración de Contraseña (días)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={securitySettings.passwordExpiry}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev,
                    passwordExpiry: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="maxLoginAttempts">Máximo Intentos de Login</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev,
                    maxLoginAttempts: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="twoFactorAuth">Autenticación de Dos Factores</Label>
                <Switch
                  id="twoFactorAuth"
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({
                    ...prev,
                    twoFactorAuth: checked
                  }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auditLogging">Registro de Auditoría</Label>
                <Switch
                  id="auditLogging"
                  checked={securitySettings.auditLogging}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({
                    ...prev,
                    auditLogging: checked
                  }))}
                />
              </div>
              <Button onClick={handleSaveSecuritySettings} disabled={isLoading} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                {isLoading ? "Probando..." : "Probar Conexión BD"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Última Actualización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Servidor de Base de Datos</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-800">Activo</Badge></TableCell>
                <TableCell>{loadingStats ? '...' : systemStats?.databaseSize ?? '-'}</TableCell>
                <TableCell>{loadingStats ? '...' : systemStats?.lastBackup ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Uso de CPU</TableCell>
                <TableCell><Badge className="bg-blue-100 text-blue-800">Normal</Badge></TableCell>
                <TableCell>{loadingStats ? '...' : `${systemStats?.cpuUsage ?? '-'}%`}</TableCell>
                <TableCell>En tiempo real</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Uso de Memoria</TableCell>
                <TableCell><Badge className="bg-yellow-100 text-yellow-800">Moderado</Badge></TableCell>
                <TableCell>{loadingStats ? '...' : `${systemStats?.memoryUsage ?? '-'}%`}</TableCell>
                <TableCell>En tiempo real</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Espacio en Disco</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-800">Óptimo</Badge></TableCell>
                <TableCell>{loadingStats ? '...' : `${systemStats?.diskUsage ?? '-'}%`}</TableCell>
                <TableCell>En tiempo real</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}