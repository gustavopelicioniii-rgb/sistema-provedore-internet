import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, ClipboardList, Headset, Wrench, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  label: string;
  detail?: string;
  group: "customers" | "contracts" | "tickets" | "service_orders";
  path: string;
}

const groupConfig = {
  customers: { label: "Clientes", icon: Users },
  contracts: { label: "Contratos", icon: ClipboardList },
  tickets: { label: "Tickets", icon: Headset },
  service_orders: { label: "Ordens de Serviço", icon: Wrench },
};

function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["global-search", query],
    enabled: query.length >= 2,
    queryFn: async (): Promise<SearchResult[]> => {
      const term = `%${query}%`;
      const results: SearchResult[] = [];

      const [customers, contracts, tickets, serviceOrders] = await Promise.all([
        supabase.from("customers").select("id, name, cpf_cnpj, phone").ilike("name", term).limit(5),
        supabase.from("contracts").select("id, customer_id, status, customers(name)").or(`status.ilike.${term}`).limit(5),
        supabase.from("tickets").select("id, subject, status, priority").ilike("subject", term).limit(5),
        supabase.from("service_orders").select("id, type, status, customers(name)").limit(5),
      ]);

      customers.data?.forEach((c) => {
        results.push({
          id: c.id,
          label: c.name,
          detail: c.cpf_cnpj || c.phone || undefined,
          group: "customers",
          path: "/clientes",
        });
      });

      // For contracts, search by customer name
      const contractsWithCustomer = contracts.data?.filter((c) => {
        const name = (c.customers as any)?.name || "";
        return name.toLowerCase().includes(query.toLowerCase());
      }) || [];
      contractsWithCustomer.forEach((c) => {
        results.push({
          id: c.id,
          label: `Contrato — ${(c.customers as any)?.name || "Cliente"}`,
          detail: c.status,
          group: "contracts",
          path: "/contratos",
        });
      });

      tickets.data?.forEach((t) => {
        results.push({
          id: t.id,
          label: t.subject,
          detail: `${t.priority} • ${t.status}`,
          group: "tickets",
          path: "/atendimento",
        });
      });

      serviceOrders.data?.forEach((o) => {
        const customerName = (o.customers as any)?.name || "";
        if (customerName.toLowerCase().includes(query.toLowerCase()) || o.type.includes(query.toLowerCase())) {
          results.push({
            id: o.id,
            label: `OS ${o.type} — ${customerName || "Cliente"}`,
            detail: o.status,
            group: "service_orders",
            path: "/ordens-servico",
          });
        }
      });

      return results;
    },
    staleTime: 5000,
  });
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: results, isLoading } = useGlobalSearch(query);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      navigate(result.path);
    },
    [navigate]
  );

  const grouped = (results || []).reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.group]) acc[r.group] = [];
    acc[r.group].push(r);
    return acc;
  }, {});

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative h-8 w-full max-w-[260px] justify-start gap-2 text-xs text-muted-foreground font-normal"
      >
        <Search className="size-3.5" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, contratos, tickets, OS..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && query.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && query.length >= 2 && !results?.length && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}
          {query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => {
            const config = groupConfig[group as keyof typeof groupConfig];
            const GroupIcon = config.icon;
            return (
              <CommandGroup key={group} heading={config.label}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.detail || ""}`}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <GroupIcon className="mr-2 size-4 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm">{item.label}</span>
                      {item.detail && (
                        <span className="truncate text-[11px] text-muted-foreground">{item.detail}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
