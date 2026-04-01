import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VaraFormDialog } from "@/components/varas/VaraFormDialog";
import { Search, Landmark, Loader2, Pencil } from "lucide-react";

const Varas = () => {
  const [search, setSearch] = useState("");

  const { data: varas = [], isLoading } = useQuery({
    queryKey: ["juntas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("juntas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const filtered = varas.filter((j) => {
    const term = search.toLowerCase();
    return (
      j.jcj_real.toLowerCase().includes(term) ||
      (j.local_real && j.local_real.toLowerCase().includes(term)) ||
      (j.cidade && j.cidade.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Varas</h1>
          <p className="text-muted-foreground text-sm mt-1">{varas.length} registros</p>
        </div>
        <VaraFormDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por vara, local ou cidade..."
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
          <Landmark className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {search ? "Nenhuma vara encontrada." : "Nenhuma vara cadastrada ainda."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden animate-fade-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Vara</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Local</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Endereço</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cidade/UF</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{j.jcj_real}</td>
                    <td className="p-3">{j.local_real || "—"}</td>
                    <td className="p-3">{j.endereco || "—"}</td>
                    <td className="p-3">{[j.cidade, j.estado].filter(Boolean).join("/") || "—"}</td>
                    <td className="p-3">{j.telefone || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <VaraFormDialog
                          editData={j}
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
            {filtered.map((j) => (
              <div key={j.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{j.jcj_real}</p>
                    {j.local_real && <p className="text-sm text-muted-foreground">{j.local_real}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <VaraFormDialog
                      editData={j}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />

                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {j.cidade && <span>{j.cidade}/{j.estado}</span>}
                  {j.telefone && <span>{j.telefone}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Varas;
