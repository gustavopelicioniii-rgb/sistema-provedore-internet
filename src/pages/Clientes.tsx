import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter } from "lucide-react";

const mockClientes = [
  { id: 1, nome: "João Silva", cpf: "123.456.789-00", plano: "Fibra 300MB", status: "Ativo", cidade: "São Paulo", score: 9.2 },
  { id: 2, nome: "Maria Souza", cpf: "987.654.321-00", plano: "Fibra 200MB", status: "Ativo", cidade: "Campinas", score: 8.5 },
  { id: 3, nome: "Pedro Oliveira", cpf: "456.789.123-00", plano: "Fibra 100MB", status: "Suspenso", cidade: "Santos", score: 4.1 },
  { id: 4, nome: "Ana Costa", cpf: "321.654.987-00", plano: "Fibra 500MB", status: "Ativo", cidade: "São Paulo", score: 9.8 },
  { id: 5, nome: "Carlos Lima", cpf: "654.987.321-00", plano: "Fibra 100MB", status: "Inadimplente", cidade: "Guarulhos", score: 2.3 },
  { id: 6, nome: "Fernanda Rocha", cpf: "789.123.456-00", plano: "Fibra 300MB", status: "Ativo", cidade: "Osasco", score: 7.6 },
];

const statusColor: Record<string, string> = {
  Ativo: "bg-success/10 text-success border-success/20",
  Suspenso: "bg-warning/10 text-warning border-warning/20",
  Inadimplente: "bg-destructive/10 text-destructive border-destructive/20",
  Cancelado: "bg-muted text-muted-foreground border-muted",
};

export default function Clientes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus assinantes e contratos</p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Todos os Clientes</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou CPF..." className="pl-9" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClientes.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{c.cpf}</TableCell>
                  <TableCell>{c.plano}</TableCell>
                  <TableCell>{c.cidade}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${c.score >= 7 ? "text-success" : c.score >= 4 ? "text-warning" : "text-destructive"}`}>
                      {c.score.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[c.status]}>
                      {c.status}
                    </Badge>
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
