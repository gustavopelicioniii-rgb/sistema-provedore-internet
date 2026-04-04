import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, Link, Check, X, Search } from "lucide-react";
import {
  useBankReconciliations,
  useBankTransactions,
  useImportBankFile,
  useMatchTransaction,
  parseOFXFile,
  type BankReconciliation,
  type BankTransaction,
} from "@/hooks/useBankReconciliation";
import { useFinanceiroData } from "@/hooks/useFinanceiroData";
import { formatCurrency } from "@/utils/finance";
import { format } from "date-fns";

const statusLabels: Record<string, { label: string; color: string }> = {
  unmatched: { label: "Sem match", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  matched: { label: "Conciliado", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  ignored: { label: "Ignorado", color: "bg-muted text-muted-foreground border-muted" },
};

export function BankReconciliationTab() {
  const { data: reconciliations, isLoading: recLoading } = useBankReconciliations();
  const importFile = useImportBankFile();
  const matchTx = useMatchTransaction();
  const { data: finData } = useFinanceiroData();

  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const { data: transactions, isLoading: txLoading } = useBankTransactions(selectedRecId ?? undefined);
  const [matchDialog, setMatchDialog] = useState<BankTransaction | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseOFXFile(text);
    if (!parsed.length) {
      return;
    }
    const reconId = await importFile.mutateAsync({ fileName: file.name, transactions: parsed });
    setSelectedRecId(reconId);
    e.target.value = "";
  };

  const pendingInvoices = useMemo(() => {
    if (!finData) return [];
    return finData.recentInvoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .filter((i) => !invoiceSearch || i.customerName.toLowerCase().includes(invoiceSearch.toLowerCase()));
  }, [finData, invoiceSearch]);

  const handleMatch = async (invoiceId: string) => {
    if (!matchDialog) return;
    await matchTx.mutateAsync({ transactionId: matchDialog.id, invoiceId });
    setMatchDialog(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Importação Bancária</CardTitle>
              <CardDescription>Importe arquivos OFX para conciliação automática</CardDescription>
            </div>
            <div>
              <input type="file" accept=".ofx,.OFX" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={importFile.isPending}>
                {importFile.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Upload className="size-4 mr-1.5" />}
                Importar OFX
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reconciliation list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Importações</CardTitle>
        </CardHeader>
        <CardContent>
          {recLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !reconciliations?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma importação realizada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((r) => (
                  <TableRow
                    key={r.id}
                    className={`cursor-pointer ${selectedRecId === r.id ? "bg-muted" : ""}`}
                    onClick={() => setSelectedRecId(r.id)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      {r.file_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(r.imported_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-emerald-600 font-medium">{r.matched_count}</span>
                      <span className="text-muted-foreground"> / {r.matched_count + r.unmatched_count}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRecId(r.id)}>Ver</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      {selectedRecId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !transactions?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const st = statusLabels[tx.status];
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tx.transaction_date + "T00:00:00"), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">{tx.description}</TableCell>
                        <TableCell className={tx.amount >= 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                          {formatCurrency(Math.abs(tx.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.matched_invoice_id
                            ? (tx.invoices as any)?.customers?.name || "Fatura vinculada"
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {tx.status === "unmatched" && tx.amount > 0 && (
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => setMatchDialog(tx)}>
                              <Link className="size-3 mr-1" /> Match
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Match Dialog */}
      <Dialog open={!!matchDialog} onOpenChange={(v) => !v && setMatchDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar Transação</DialogTitle>
          </DialogHeader>
          {matchDialog && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm font-medium">{matchDialog.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(matchDialog.transaction_date + "T00:00:00"), "dd/MM/yyyy")} • {formatCurrency(Math.abs(matchDialog.amount))}
                </p>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fatura por cliente..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {pendingInvoices.map((inv) => (
                    <button
                      key={inv.id}
                      className="w-full flex items-center justify-between p-2 rounded-md border text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => handleMatch(inv.id)}
                    >
                      <div>
                        <p className="font-medium">{inv.customerName}</p>
                        <p className="text-xs text-muted-foreground">Venc: {inv.dueDate}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{formatCurrency(inv.amount)}</Badge>
                    </button>
                  ))}
                  {!pendingInvoices.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma fatura pendente encontrada</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
