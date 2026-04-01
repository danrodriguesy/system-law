import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";
import { ClienteDetailModal } from "@/components/clientes/ClienteDetailModal";
import { Search, Users, Loader2, Eye, Pencil } from "lucide-react";

const Clientes = () => {
  const [search, setSearch] = useState("");
  const [detailCliente, setDetailCliente] = useState<any>(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const filtered = clientes.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.nome_cliente.toLowerCase().includes(term) ||
      (c.pasta && c.pasta.toLowerCase().includes(term)) ||
      (c.reclamado && c.reclamado.toLowerCase().includes(term)) ||
      (c.cidade && c.cidade.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{clientes.length} registros</p>
        </div>
        <ClienteFormDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, pasta, reclamado ou cidade..."
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
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden animate-fade-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Pasta</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Reclamado</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cidade/UF</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{c.pasta || "—"}</td>
                    <td className="p-3 font-medium">{c.nome_cliente}</td>
                    <td className="p-3">{c.reclamado || "—"}</td>
                    <td className="p-3">{[c.cidade, c.estado].filter(Boolean).join("/") || "—"}</td>
                    <td className="p-3">{c.telefone || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-primary"
                          onClick={() => setDetailCliente(c)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <ClienteFormDialog
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
          <div className="md:hidden space-y-3 animate-fade-in">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{c.nome_cliente}</p>
                    <p className="text-xs text-muted-foreground">Pasta: {c.pasta || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-primary"
                      onClick={() => setDetailCliente(c)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <ClienteFormDialog
                      editData={c}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />

                  </div>
                </div>
                {c.reclamado && <p className="text-sm text-muted-foreground">Reclamado: {c.reclamado}</p>}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {c.cidade && <span>{c.cidade}/{c.estado}</span>}
                  {c.telefone && <span>{c.telefone}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <ClienteDetailModal
        open={!!detailCliente}
        onOpenChange={(open) => { if (!open) setDetailCliente(null); }}
        cliente={detailCliente}
      />
    </div>
  );
};

export default Clientes;
