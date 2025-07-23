import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  activeTrips: number;
  completedToday: number;
  litersTransported: number;
  trucksInRoute: number;
}

export function StatsCards() {
  const { data, isLoading } = useQuery<{ trips: any[]; stats: Stats }>({
    queryKey: ["/api/viajes"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={`loading-skeleton-${i}`}>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="ml-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = data?.stats ?? {
    activeTrips: 0,
    completedToday: 0,
    litersTransported: 0,
    trucksInRoute: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">🛣️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Viajes Activos</p>
              <p className="text-2xl font-bold text-slate-900">{stats.activeTrips}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Completados Hoy</p>
              <p className="text-2xl font-bold text-slate-900">{stats.completedToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 text-xl">⛽</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Litros Transportados</p>
              <p className="text-2xl font-bold text-slate-900">
                {typeof stats.litersTransported === "number" && !isNaN(stats.litersTransported)
                  ? stats.litersTransported.toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🚛</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Camiones en Ruta</p>
              <p className="text-2xl font-bold text-slate-900">{stats.trucksInRoute}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
