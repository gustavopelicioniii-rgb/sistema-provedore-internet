import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Search,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/finance";

type NfStatus = "authorized" | "pending" | "rejected" | "cancelled";

interface NotaFiscal {
  id: string;
  number: string;
  series: string;
  type: "nfe21" | "nfe22" | "nfcom62";
  customerName: string;
  value: number;
  issueDate: string;
  status: NfStatus;
  accessKey?: string;
}

const mockNotas: NotaFiscal[] = [
  { id: "1", number: "000001", series: "1", type: "nfe21", customerName: "João Silva", value: 129.90, issueDate: "2026-04-01", status: "authorized", accessKey: "35260412345678000195550010000000011..." },
  { id: "2", number: "000002", series: "1", type: "nfe21", customerName: "Maria Santos", value: 199.90, issueDate: "2026-04-01", status: "authorized", accessKey: "35260412345678000195550010000000021..." },
  { id: "3", number: "000003", series: "1", type: "nfcom62", customerName: "Tech Corp LTDA", value: 549.90, issueDate: "2026-04-02", status: "pending" },
  { id: "4", number: "000004", series: "1", type: "nfe22", customerName: "Carlos Oliveira", value: 89.90, issueDate: "2026-04-02", status: "rejected" },
  { id: "5", number: "000005", series: "1", type: "nfe21", customerName: "Ana Costa", value: 159.90, issueDate: "2026-04-03", status: "cancelled" },
];

const statusConfig: Record<NfStatus, { label: string; className: string; icon: typeof CheckCircle }> = {
  authorized: { label: "Autorizada", className: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  rejected: { label: "Rejeitada", className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  cancelled: { label: "Cancelada", className: "bg-muted text-muted-foreground border-muted", icon: AlertTriangle },
};

const typeLabels: Record<string, string> = {
  nfe21: "NF-e Mod. 21",
  nfe22: "NF-e Mod. 22",
  nfcom62: "NFCom Mod. 62",
};

export default function Fiscal() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("notas");

  const filtered = mockNotas.filter(
    (n) => n.customerName.toLowerCase().includes(search.toLowerCase()) || n.number.includes(search)
  );

  const authorized = mockNotas.filter((n) => n.status === "authorized").length;
  const pending = mockNotas.filter((n) => n.status === "pending").length;
  const totalValue = mockNotas.filter((n) => n.status === "authorized").reduce((a, n) => a + n.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fiscal / NF-e</h1>
          <p className="text-muted-foreground text-sm">Emissão e gestão de notas fiscais eletrônicas</p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" /> Emitir NF-e
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Notas Autorizadas</p>
              <CheckCircle className="size-4 text-success" />
            </div>
            <p className="mt-2 text-2xl font-bold">{authorized}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
              <Clock className="size-4 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Valor Total Autorizado</p>
              <Receipt className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Total de Notas</p>
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{mockNotas.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Notas Fiscais</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente ou número..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma nota fiscal encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((nota) => {
                  const st = statusConfig[nota.status];
                  return (
                    <TableRow key={nota.id}>
                      <TableCell className="font-mono font-medium">{nota.number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{typeLabels[nota.type]}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{nota.customerName}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(nota.value)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(nota.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st.className}>
                          <st.icon className="mr-1 size-3" /> {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {nota.status === "authorized" && (
                            <>
                              <Button variant="ghost" size="icon" className="size-7" title="Baixar XML">
                                <Download className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-7" title="Enviar por email">
                                <Send className="size-3.5" />
                              </Button>
                            </>
                          )}
                          {nota.status === "pending" && (
                            <Button variant="ghost" size="icon" className="size-7" title="Reprocessar">
                              <RefreshCw className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
