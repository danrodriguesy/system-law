import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { JuntaFormDialog } from "@/components/juntas/JuntaFormDialog";
import { Search, Landmark, Loader2 } from "lucide-react";

const Juntas = () => {
  const [search, setSearch] = useState("");

  const { data: juntas = [], isLoading } = useQuery({
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

  const filtered = juntas.filter((j) => {
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
          <h1 className="font-display text-2xl md:text-3xl font-bold">Juntas</h1>
          <p className="text-muted-foreground text-sm mt-1">{juntas.length} registros</p>
        </div>
        <JuntaFormDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por JCJ, local ou cidade..."
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
            {search ? "Nenhuma junta encontrada." : "Nenhuma junta cadastrada ainda."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden animate-fade-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">JCJ</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Local</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Endereço</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cidade/UF</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 animate-fade-in">
            {filtered.map((j) => (
              <div key={j.id} className="rounded-lg border bg-card p-4 space-y-2">
                <p className="font-medium">{j.jcj_real}</p>
                {j.local_real && <p className="text-sm text-muted-foreground">{j.local_real}</p>}
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

export default Juntas;
