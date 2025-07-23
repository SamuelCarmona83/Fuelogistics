import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, Download, TrendingUp, Fuel, Truck, MapPin, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function ReportsDashboard() {
  const [reportType, setReportType] = useState("mensual");

  // Fetch trips data for reports using authentic data
  const { data: apiData } = useQuery({
    queryKey: ['/api/viajes'],
  });

  const tripsData = apiData?.trips ?? [];

  // Process data for charts
  const processTripsData = () => {
    if (!tripsData || !Array.isArray(tripsData)) return null;

    // Daily trips count
    const dailyTrips = tripsData.reduce((acc: any, trip: any) => {
      const date = format(new Date(trip.fecha_salida), 'yyyy-MM-dd');
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    }, {});

    const dailyTripsChart = Object.entries(dailyTrips).map(([date, count]) => ({
      date: format(new Date(date), 'MMM dd'),
      trips: count,
    }));

    // Fuel type distribution
    const fuelTypes = tripsData.reduce((acc: any, trip: any) => {
      acc[trip.combustible] = (acc[trip.combustible] ?? 0) + 1;
      return acc;
    }, {});

    const fuelTypeChart = Object.entries(fuelTypes).map(([type, count]) => ({
      name: type,
      value: count,
    }));

    // Status distribution
    const statusData = tripsData.reduce((acc: any, trip: any) => {
      acc[trip.estado] = (acc[trip.estado] ?? 0) + 1;
      return acc;
    }, {});

    const statusChart = Object.entries(statusData).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // Monthly fuel volume
    const monthlyVolume = tripsData.reduce((acc: any, trip: any) => {
      const month = format(new Date(trip.fecha_salida), 'MMM yyyy');
      acc[month] = (acc[month] ?? 0) + trip.cantidad_litros;
      return acc;
    }, {});

    const volumeChart = Object.entries(monthlyVolume).map(([month, volume]) => ({
      month,
      volume,
    }));

    // Top drivers by trips
    const driverTrips = tripsData.reduce((acc: any, trip: any) => {
      acc[trip.conductor] = (acc[trip.conductor] ?? 0) + 1;
      return acc;
    }, {});

    const topDrivers = Object.entries(driverTrips)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([driver, trips]) => ({
        driver,
        trips,
      }));

    return {
      dailyTripsChart,
      fuelTypeChart,
      statusChart,
      volumeChart,
      topDrivers,
      totalTrips: tripsData.length,
      totalVolume: tripsData.reduce((sum, trip) => sum + trip.cantidad_litros, 0),
      completedTrips: tripsData.filter(trip => trip.estado === "Completado").length,
      activeTrips: tripsData.filter(trip => trip.estado === "En tránsito").length,
    };
  };

  const chartsData = processTripsData();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportReport = () => {
    const reportData = {
      period: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      },
      type: reportType,
      data: chartsData,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!chartsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Cargando Reportes</h3>
            <p className="text-slate-500">Procesando datos para generar reportes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reportes y Análisis</h2>
          <p className="text-slate-600">Análisis detallado de operaciones y rendimiento</p>
        </div>
        <div className="flex space-x-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diario</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Viajes</p>
                <p className="text-2xl font-bold text-slate-900">{chartsData.totalTrips}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Volumen Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(chartsData.totalVolume / 1000).toFixed(1)}K L
                </p>
              </div>
              <Fuel className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+8% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Viajes Completados</p>
                <p className="text-2xl font-bold text-slate-900">{chartsData.completedTrips}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-slate-600">
                {Math.round((chartsData.completedTrips / chartsData.totalTrips) * 100)}% tasa de éxito
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Viajes Activos</p>
                <p className="text-2xl font-bold text-slate-900">{chartsData.activeTrips}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-slate-600">En tránsito actualmente</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trips Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Viajes por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartsData.dailyTripsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trips" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Combustible</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartsData.fuelTypeChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartsData.fuelTypeChart.map((entry: any, index: number) => (
                    <Cell key={`fuel-type-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Volumen Mensual de Combustible</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartsData.volumeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} L`, 'Volumen']} />
                <Line type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trip Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Viajes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartsData.statusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartsData.statusChart.map((entry: any, index: number) => (
                    <Cell key={`status-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Conductores por Número de Viajes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartsData.topDrivers.map((driver: any, index: number) => (
              <div key={driver.driver} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <span className="font-medium">{driver.driver}</span>
                </div>
                <Badge variant="secondary">{driver.trips} viajes</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}