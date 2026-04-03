import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterState {
  dateRange: DateRange;
  status?: string;
}

const presets = [
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Últimos 3 meses", value: "3m" },
  { label: "Últimos 6 meses", value: "6m" },
  { label: "Últimos 12 meses", value: "12m" },
  { label: "Mês atual", value: "current" },
  { label: "Mês anterior", value: "prev" },
  { label: "Personalizado", value: "custom" },
] as const;

function getPresetRange(preset: string): DateRange {
  const now = new Date();
  switch (preset) {
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "3m":
      return { from: subMonths(now, 3), to: now };
    case "6m":
      return { from: subMonths(now, 6), to: now };
    case "12m":
      return { from: subMonths(now, 12), to: now };
    case "current":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "prev": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    default:
      return { from: subMonths(now, 6), to: now };
  }
}

interface DateRangeFilterProps {
  value: FilterState;
  onChange: (state: FilterState) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  className?: string;
}

export function DateRangeFilter({ value, onChange, statusOptions, className }: DateRangeFilterProps) {
  const [preset, setPreset] = useState("6m");

  const handlePreset = (p: string) => {
    setPreset(p);
    if (p !== "custom") {
      onChange({ ...value, dateRange: getPresetRange(p) });
    }
  };

  const activeFilters = (value.status && value.status !== "all" ? 1 : 0) + (preset !== "6m" ? 1 : 0);

  const clearFilters = () => {
    setPreset("6m");
    onChange({ dateRange: getPresetRange("6m"), status: undefined });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Filter className="size-4 text-muted-foreground" />

      <Select value={preset} onValueChange={handlePreset}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <CalendarIcon className="size-3.5" />
                {format(value.dateRange.from, "dd/MM/yy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.dateRange.from}
                onSelect={(d) => d && onChange({ ...value, dateRange: { ...value.dateRange, from: d } })}
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">até</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <CalendarIcon className="size-3.5" />
                {format(value.dateRange.to, "dd/MM/yy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.dateRange.to}
                onSelect={(d) => d && onChange({ ...value, dateRange: { ...value.dateRange, to: d } })}
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {statusOptions && (
        <Select value={value.status || "all"} onValueChange={(s) => onChange({ ...value, status: s === "all" ? undefined : s })}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {activeFilters > 0 && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearFilters}>
          <X className="size-3" />
          Limpar
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{activeFilters}</Badge>
        </Button>
      )}
    </div>
  );
}

export function useFilterState(defaultMonths = 6): [FilterState, (s: FilterState) => void] {
  const [state, setState] = useState<FilterState>({
    dateRange: getPresetRange(`${defaultMonths}m`),
  });
  return [state, setState];
}
