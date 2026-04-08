import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompromissoFormDialog } from "@/components/compromissos/CompromissoFormDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, ClipboardList, Loader2, Pencil, MessageSquareText, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Compromissos = () => {
  const [search, setSearch] = useState("");
  const [respostaModal, setRespostaModal] = useState<any>(null);
  const [respostaText, setRespostaText] = useState("");
  const [respostaDataHora, setRespostaDataHora] = useState("");
  const [printModal, setPrintModal] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: compromissos = [], isLoading } = useQuery({
    queryKey: ["compromissos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compromissos")
        .select("*, clientes(nome_cliente, pasta, reclamado), juntas(jcj_real)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch respostas for the selected compromisso (modal de resposta)
  const { data: compromissoRespostas = [] } = useQuery({
    queryKey: ["respostas-compromisso", respostaModal?.id],
    queryFn: async () => {
      if (!respostaModal?.id) return [];
      const { data, error } = await supabase
        .from("respostas_compromisso")
        .select(`
          *,
          clientes (pasta, nome_cliente, reclamado),
          compromissos (processo, juntas (jcj_real))
        `)
        .eq("compromisso_id", respostaModal.id)
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!respostaModal?.id,
  });

  // Fetch respostas for the print modal
  const { data: printRespostas = [] } = useQuery({
    queryKey: ["respostas-print", printModal?.id],
    queryFn: async () => {
      if (!printModal?.id) return [];
      const { data, error } = await supabase
        .from("respostas_compromisso")
        .select(`
          *,
          clientes (pasta, nome_cliente, reclamado),
          compromissos (processo, juntas (jcj_real))
        `)
        .eq("compromisso_id", printModal.id)
        .order("data_registro", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!printModal?.id,
  });

  const respostaMutation = useMutation({
    mutationFn: async () => {
      if (!respostaModal) return;
      const { error } = await supabase.from("respostas_compromisso").insert({
        user_id: user!.id,
        cliente_id: respostaModal.cliente_id,
        compromisso_id: respostaModal.id,
        descricao_resposta: respostaText || null,
        data_registro: respostaDataHora ? new Date(respostaDataHora).toISOString() : new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["respostas"] });
      queryClient.invalidateQueries({ queryKey: ["respostas-compromisso", respostaModal?.id] });
      queryClient.invalidateQueries({ queryKey: ["respostas-count"] });
      toast({ title: "Resposta registrada com sucesso!" });
      setRespostaText("");
      setRespostaDataHora(new Date().toISOString().slice(0, 16));
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const handlePrint = () => {
    if (!printModal) return;

    const cliente = printModal.clientes as any;
    const junta = printModal.juntas as any;

    const respostasHTML = printRespostas.map((r: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${r.data_registro ? format(new Date(r.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${r.descricao_resposta || "Sem descrição"}</td>
      </tr>
    `).join("");

    const printWindow = document.createElement("div");
    printWindow.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Compromisso e Respostas - ${cliente?.nome_cliente || ""}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              font-size: 20px;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .info-item {
              font-size: 14px;
            }
            .info-label {
              font-size: 11px;
              color: #666;
              margin-bottom: 4px;
            }
            .info-value {
              font-weight: 600;
            }
            h2 {
              font-size: 16px;
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background: #f5f5f5;
              padding: 10px 8px;
              text-align: left;
              font-size: 13px;
              font-weight: 600;
              border: 1px solid #ddd;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
              font-size: 12px;
              vertical-align: top;
            }
            tr:nth-child(even) {
              background: #fafafa;
            }
            @media print {
              body {
                margin: 10px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Compromisso e Respostas</h1>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Pasta</div>
              <div class="info-value">${cliente?.pasta || "—"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Cliente</div>
              <div class="info-value">${cliente?.nome_cliente || "—"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vara</div>
              <div class="info-value">${junta?.jcj_real || "—"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Processo</div>
              <div class="info-value">${printModal.processo || "—"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data/Hora</div>
              <div class="info-value">${printModal.data ? format(new Date(printModal.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}</div>
            </div>
          </div>
          <h2>Respostas (${printRespostas.length})</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 150px;">Data Registro</th>
                <th>Resposta</th>
              </tr>
            </thead>
            <tbody>
              ${respostasHTML || "<tr><td colspan='2' style='text-align: center; padding: 20px;'>Nenhuma resposta registrada.</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(printWindow.innerHTML);
      newWindow.document.close();
      newWindow.focus();
      setTimeout(() => {
        newWindow.print();
        newWindow.close();
      }, 250);
    }
  };

  const filtered = compromissos.filter((c) => {
    const term = search.toLowerCase();
    const clienteName = (c.clientes as any)?.nome_cliente || "";
    const pasta = (c.clientes as any)?.pasta || "";
    const varaName = (c.juntas as any)?.jcj_real || "";
    return (
      clienteName.toLowerCase().includes(term) ||
      pasta.toLowerCase().includes(term) ||
      varaName.toLowerCase().includes(term) ||
      (c.processo && c.processo.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Compromissos</h1>
          <p className="text-muted-foreground text-sm mt-1">{compromissos.length} registros</p>
        </div>
        <CompromissoFormDialog />
      </div>

      <div className="relative mb-4 print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por pasta, cliente, vara ou processo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {search ? "Nenhum compromisso encontrado." : "Nenhum compromisso cadastrado ainda."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden animate-fade-in print:hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Pasta</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Vara</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Processo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data/Hora</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Detalhes</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{(c.clientes as any)?.pasta || "—"}</td>
                    <td className="p-3 font-medium">{(c.clientes as any)?.nome_cliente || "—"}</td>
                    <td className="p-3">{(c.juntas as any)?.jcj_real || "—"}</td>
                    <td className="p-3">{c.processo || "—"}</td>
                    <td className="p-3">
                      {c.data ? format(new Date(c.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{c.status || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-blue-600"
                          title="Imprimir"
                          onClick={() => setPrintModal(c)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-emerald-600"
                          title="Adicionar Resposta"
                          onClick={() => {
                            setRespostaModal(c);
                            setRespostaDataHora(new Date().toISOString().slice(0, 16));
                          }}
                        >
                          <MessageSquareText className="h-4 w-4" />
                        </Button>
                        <CompromissoFormDialog
                          editData={c}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-primary">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 animate-fade-in print:hidden">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{(c.clientes as any)?.nome_cliente || "—"}</p>
                    {(c.clientes as any)?.pasta && <p className="text-xs text-muted-foreground">Pasta: {(c.clientes as any).pasta}</p>}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {c.processo && <span>Proc: {c.processo}</span>}
                  {(c.juntas as any)?.jcj_real && <span>Vara: {(c.juntas as any).jcj_real}</span>}
                </div>
                {c.data && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(c.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                {c.status && <p className="text-xs text-muted-foreground">Detalhes: {c.status}</p>}
                <div className="flex items-center gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-white hover:bg-blue-600"
                    onClick={() => setPrintModal(c)}
                  >
                    <Printer className="h-3 w-3 mr-1" /> Imprimir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-white hover:bg-emerald-600"
                    onClick={() => {
                      setRespostaModal(c);
                      setRespostaDataHora(new Date().toISOString().slice(0, 16));
                    }}
                  >
                    <MessageSquareText className="h-3 w-3 mr-1" /> Resposta
                  </Button>
                  <CompromissoFormDialog
                    editData={c}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-white hover:bg-primary">
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}


      {/* Modal de resposta - desktop maior */}
      <Dialog open={!!respostaModal} onOpenChange={(v) => { if (!v) setRespostaModal(null); }}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Respostas do Compromisso</DialogTitle>
          </DialogHeader>
          {respostaModal && (
            <div className="space-y-4">
              {/* Disabled info fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Input
                    value={`${(respostaModal.clientes as any)?.pasta ? (respostaModal.clientes as any).pasta + " — " : ""}${(respostaModal.clientes as any)?.nome_cliente || ""}`}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Processo</Label>
                  <Input
                    value={respostaModal.processo || "Sem processo"}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <hr className="border-border" />

              {/* New response form */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Data/Hora da Resposta</Label>
                    <Input
                      type="datetime-local"
                      value={respostaDataHora}
                      onChange={(e) => setRespostaDataHora(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição da Resposta</Label>
                  <Textarea
                    value={respostaText}
                    onChange={(e) => setRespostaText(e.target.value)}
                    placeholder="Descreva a resposta do compromisso..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => respostaMutation.mutate()}
                    disabled={respostaMutation.isPending}
                    size="sm"
                  >
                    {respostaMutation.isPending && <Loader2 className="animate-spin mr-1 h-3 w-3" />}
                    Nova Resposta do Compromisso
                  </Button>
                </div>
              </div>

              {/* Existing responses list */}
              {compromissoRespostas.length > 0 && (
                <>
                  <hr className="border-border" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display font-semibold text-sm">Respostas do Compromisso ({compromissoRespostas.length})</h4>
                      {/* <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs h-7">
                        <Printer className="h-3 w-3" /> Imprimir
                      </Button> */}
                    </div>
                    <div className="space-y-2" id="respostas-report">
                      {/* Print-only header */}
                      <div className="hidden print:block mb-6">
                        <h2 className="text-lg font-bold mb-4">Relatório de Respostas do Compromisso</h2>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div><strong>Pasta:</strong> {(respostaModal.clientes as any)?.pasta || "—"}</div>
                          <div><strong>Reclamante:</strong> {(respostaModal.clientes as any)?.nome_cliente || "—"}</div>
                          <div><strong>Reclamada:</strong> {(respostaModal.clientes as any)?.reclamado || "—"}</div>
                          <div><strong>Processo:</strong> {respostaModal.processo || "—"}</div>
                        </div>
                        <hr className="my-3" />
                      </div>

                      {/* Table header - hidden on print */}
                      <div className="hidden lg:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 print:hidden">
                        <div className="col-span-1">Pasta</div>
                        <div className="col-span-2">Reclamante</div>
                        <div className="col-span-2">Reclamada</div>
                        <div className="col-span-1">Vara</div>
                        <div className="col-span-1">Processo</div>
                        <div className="col-span-4">Resposta</div>
                        <div className="col-span-1 text-right">Data/Hora</div>
                      </div>

                      {/* Print table header */}
                      <div className="hidden print:grid grid-cols-6 gap-2 text-xs font-bold border-b pb-2 mb-2">
                        <div className="col-span-1">Pasta</div>
                        <div className="col-span-1">Reclamante</div>
                        <div className="col-span-1">Reclamada</div>
                        <div className="col-span-1">Processo</div>
                        <div className="col-span-1">Data/Hora</div>
                        <div className="col-span-1">Resposta</div>
                      </div>

                      {/* Responses list */}
                      {compromissoRespostas.map((r) => (
                        <div key={r.id} className="rounded-lg border bg-muted/30 p-3 print:border-0 print:p-0 print:mb-3">
                          {/* Desktop view - table format */}
                          <div className="hidden lg:grid grid-cols-12 gap-2 text-sm items-center print:hidden">
                            <div className="col-span-1 text-muted-foreground">
                              {(r.clientes as any)?.pasta || "—"}
                            </div>
                            <div className="col-span-2 font-medium">
                              {(r.clientes as any)?.nome_cliente || "—"}
                            </div>
                            <div className="col-span-2 text-muted-foreground">
                              {(r.clientes as any)?.reclamado || "—"}
                            </div>
                            <div className="col-span-1">
                              {(r.compromissos as any)?.juntas?.jcj_real || "—"}
                            </div>
                            <div className="col-span-1 text-muted-foreground truncate">
                              {(r.compromissos as any)?.processo || "—"}
                            </div>
                            <div className="col-span-4 text-muted-foreground line-clamp-3">
                              {r.descricao_resposta || "Sem descrição"}
                            </div>
                            <div className="col-span-1 text-xs text-muted-foreground text-right whitespace-nowrap">
                              {r.data_registro ? format(new Date(r.data_registro), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                            </div>
                          </div>

                          {/* Print view - simplified table row */}
                          <div className="hidden print:grid grid-cols-6 gap-2 text-xs border-b pb-2 mb-2">
                            <div className="col-span-1">{(r.clientes as any)?.pasta || "—"}</div>
                            <div className="col-span-1">{(r.clientes as any)?.nome_cliente || "—"}</div>
                            <div className="col-span-1">{(r.clientes as any)?.reclamado || "—"}</div>
                            <div className="col-span-1 truncate">{(r.compromissos as any)?.processo || "—"}</div>
                            <div className="col-span-1">
                              {r.data_registro ? format(new Date(r.data_registro), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                            </div>
                            <div className="col-span-1">{r.descricao_resposta || "Sem descrição"}</div>
                          </div>

                          {/* Mobile view - card format */}
                          <div className="lg:hidden space-y-2 print:hidden">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Pasta:</span>{" "}
                                <span className="font-medium">{(r.clientes as any)?.pasta || "—"}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">Data:</span>{" "}
                                <span>{r.data_registro ? format(new Date(r.data_registro), "dd/MM/yyyy", { locale: ptBR }) : "—"}</span>
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Reclamante:</span>{" "}
                              <span className="font-medium">{(r.clientes as any)?.nome_cliente || "—"}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Reclamada:</span>{" "}
                              <span>{(r.clientes as any)?.reclamado || "—"}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Vara:</span>{" "}
                              <span>{(r.compromissos as any)?.juntas?.jcj_real || "—"}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Processo:</span>{" "}
                              <span>{(r.compromissos as any)?.processo || "—"}</span>
                            </div>
                            <div className="text-sm pt-2 border-t">
                              <span className="text-muted-foreground">Resposta:</span>{" "}
                              <p className="mt-1">{r.descricao_resposta || "Sem descrição"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão - Compromisso + Respostas */}
      <Dialog open={!!printModal} onOpenChange={(v) => { if (!v) setPrintModal(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center justify-between">
              <span>Imprimir Compromisso e Respostas</span>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 print:hidden">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
            </DialogTitle>
          </DialogHeader>

          {printModal && (
            <div id="print-modal-content" className="space-y-6">
              {/* Header com informações do compromisso */}
              <div className="rounded-lg border bg-card p-4 print:border-0 print:p-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Pasta</span>
                    <p className="font-medium mt-0.5">{(printModal.clientes as any)?.pasta || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Cliente</span>
                    <p className="font-medium mt-0.5">{(printModal.clientes as any)?.nome_cliente || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Vara</span>
                    <p className="font-medium mt-0.5">{(printModal.juntas as any)?.jcj_real || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Processo</span>
                    <p className="font-medium mt-0.5">{printModal.processo || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Data/Hora</span>
                    <p className="font-medium mt-0.5">
                      {printModal.data
                        ? format(new Date(printModal.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Respostas */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  Respostas ({printRespostas.length})
                </h3>

                {printRespostas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma resposta registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Table header - desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 print:hidden">
                      <div className="col-span-2">Data Registro</div>
                      <div className="col-span-10">Resposta</div>
                    </div>

                    {/* Print table header */}
                    <div className="hidden print:grid grid-cols-5 gap-2 text-xs font-bold border-b pb-2 mb-2">
                      <div>Pasta</div>
                      <div>Cliente</div>
                      <div>Processo</div>
                      <div>Data/Hora</div>
                      <div>Resposta</div>
                    </div>

                    {printRespostas.map((r: any) => (
                      <div key={r.id} className="rounded-lg border bg-muted/30 p-3 print:border print:p-2 print:mb-3">
                        {/* Desktop view */}
                        <div className="hidden md:grid grid-cols-12 gap-2 text-sm print:hidden">
                          <div className="col-span-2 text-xs text-muted-foreground whitespace-nowrap">
                            {r.data_registro
                              ? format(new Date(r.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : "—"}
                          </div>
                          <div className="col-span-10 text-muted-foreground line-clamp-4">
                            {r.descricao_resposta || "Sem descrição"}
                          </div>
                        </div>

                        {/* Print view */}
                        <div className="hidden print:grid grid-cols-5 gap-2 text-xs">
                          <div>{(r.clientes as any)?.pasta || "—"}</div>
                          <div>{(r.clientes as any)?.nome_cliente || "—"}</div>
                          <div className="truncate">{(r.compromissos as any)?.processo || "—"}</div>
                          <div>
                            {r.data_registro
                              ? format(new Date(r.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : "—"}
                          </div>
                          <div>{r.descricao_resposta || "Sem descrição"}</div>
                        </div>

                        {/* Mobile view */}
                        <div className="md:hidden space-y-2 print:hidden">
                          <div className="text-xs text-muted-foreground">
                            {r.data_registro
                              ? format(new Date(r.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : "—"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {r.descricao_resposta || "Sem descrição"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compromissos;
