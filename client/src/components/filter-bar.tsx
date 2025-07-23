import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  onFiltersChange?: (filters: {
    search?: string;
    status?: string;
    fuelType?: string;
  }) => void;
}

export function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fuelType, setFuelType] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFiltersChange?.({
      search: value,
      status,
      fuelType,
    });
  };

  const handleStatusChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setStatus(actualValue);
    onFiltersChange?.({
      search,
      status: actualValue,
      fuelType,
    });
  };

  const handleFuelTypeChange = (value: string) => {
    const actualValue = value === "all" ? "" : value;
    setFuelType(actualValue);
    onFiltersChange?.({
      search,
      status,
      fuelType: actualValue,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setFuelType("");
    onFiltersChange?.({
      search: "",
      status: "",
      fuelType: "",
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar por conductor, camión, origen o destino..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={status ?? "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los Estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="En tránsito">En tránsito</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fuelType ?? "all"} onValueChange={handleFuelTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Combustible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tipo de Combustible</SelectItem>
                <SelectItem value="Diésel">Diésel</SelectItem>
                <SelectItem value="Gasolina">Gasolina</SelectItem>
                <SelectItem value="Gas Natural">Gas Natural</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
