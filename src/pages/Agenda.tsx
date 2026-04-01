import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgendaFormDialog } from "@/components/agenda/AgendaFormDialog";
import { Search, Calendar, Loader2, Pencil } from "lucide-react";
import { format } from "date-fns";

const Agenda = () => {
  const [search, setSearch] = useState("");

  const { data: agendas = [], isLoading } = useQuery({
    queryKey: ["agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda")
        .select("*, clientes(nome_cliente, pasta)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const filtered = agendas.filter((a) => {
    const term = search.toLowerCase();
    const clienteName = (a.clientes as any)?.nome_cliente || "";
    const pasta = (a.clientes as any)?.pasta || "";
    return (
      clienteName.toLowerCase().includes(term) ||
      pasta.toLowerCase().includes(term) ||
      (a.processo && a.processo.toLowerCase().includes(term)) ||
      (a.junta && a.junta.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">{agendas.length} registros</p>
        </div>
        <AgendaFormDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, processo ou vara..."
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
          <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {search ? "Nenhum registro encontrado." : "Nenhuma agenda cadastrada ainda."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden animate-fade-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Pasta</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Processo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Vara</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data Distribuição</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{(a.clientes as any)?.pasta || "—"}</td>
                    <td className="p-3 font-medium">{(a.clientes as any)?.nome_cliente || "—"}</td>
                    <td className="p-3">{a.processo || "—"}</td>
                    <td className="p-3">{a.junta || "—"}</td>
                    <td className="p-3">{a.data_distribuicao ? format(new Date(a.data_distribuicao), "dd/MM/yyyy") : "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <AgendaFormDialog
                          editData={a}
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

          <div className="md:hidden space-y-3 animate-fade-in">
            {filtered.map((a) => (
              <div key={a.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{(a.clientes as any)?.nome_cliente || "—"}</p>
                    {(a.clientes as any)?.pasta && <p className="text-xs text-muted-foreground">Pasta: {(a.clientes as any).pasta}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <AgendaFormDialog
                      editData={a}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />

                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {a.processo && <span>Proc: {a.processo}</span>}
                  {a.junta && <span>Vara: {a.junta}</span>}
                </div>
                {a.data_distribuicao && (
                  <p className="text-xs text-muted-foreground">
                    Distribuição: {format(new Date(a.data_distribuicao), "dd/MM/yyyy")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Agenda;
