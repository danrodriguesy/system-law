import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const schema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  junta_id: z.string().optional(),
  processo: z.string().optional(),
  data: z.string().optional(),
  status: z.string().optional(), // repurposed as "detalhes"
});

type FormData = z.infer<typeof schema>;

interface CompromissoFormDialogProps {
  editData?: any;
  trigger?: React.ReactNode;
}

export function CompromissoFormDialog({ editData, trigger }: CompromissoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("id, nome_cliente, pasta").order("nome_cliente");
      return data ?? [];
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedClienteId = watch("cliente_id");

  // Fetch varas linked to the selected client (from agenda entries)
  const { data: clienteVaras = [] } = useQuery({
    queryKey: ["cliente-varas", selectedClienteId],
    queryFn: async () => {
      if (!selectedClienteId) return [];
      // Get junta names from agenda for this client
      const { data: agendaData } = await supabase
        .from("agenda")
        .select("junta")
        .eq("cliente_id", selectedClienteId)
        .order("created_at", { ascending: false });
      // Also get varas from compromissos for this client
      const { data: compData } = await supabase
        .from("compromissos")
        .select("junta_id, juntas(id, jcj_real)")
        .eq("cliente_id", selectedClienteId)
        .order("created_at", { ascending: false });

      const varaMap = new Map<string, { id: string; jcj_real: string }>();

      // From compromissos (actual junta_id references)
      compData?.forEach((c) => {
        const j = c.juntas as any;
        if (j?.id && j?.jcj_real && !varaMap.has(j.id)) {
          varaMap.set(j.id, { id: j.id, jcj_real: j.jcj_real });
        }
      });

      // From agenda (text junta field) - match with juntas table
      if (agendaData?.length) {
        const juntaNames = [...new Set(agendaData.map((a) => a.junta).filter(Boolean))];
        if (juntaNames.length > 0) {
          const { data: juntasData } = await supabase
            .from("juntas")
            .select("id, jcj_real")
            .in("jcj_real", juntaNames);
          juntasData?.forEach((j) => {
            if (!varaMap.has(j.id)) {
              varaMap.set(j.id, { id: j.id, jcj_real: j.jcj_real });
            }
          });
        }
      }

      // If no linked varas found, show all varas as fallback
      if (varaMap.size === 0) {
        const { data: allVaras } = await supabase.from("juntas").select("id, jcj_real").order("created_at", { ascending: false });
        return allVaras ?? [];
      }

      return Array.from(varaMap.values());
    },
    enabled: !!selectedClienteId,
  });

  // Fetch processos linked to the selected client (from agenda)
  const { data: clienteProcessos = [] } = useQuery({
    queryKey: ["cliente-processos", selectedClienteId],
    queryFn: async () => {
      if (!selectedClienteId) return [];
      const { data: agendaData } = await supabase
        .from("agenda")
        .select("processo")
        .eq("cliente_id", selectedClienteId)
        .order("created_at", { ascending: false });

      const processos = [...new Set((agendaData ?? []).map((a) => a.processo).filter(Boolean))] as string[];
      return processos;
    },
    enabled: !!selectedClienteId,
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        cliente_id: editData.cliente_id || "",
        junta_id: editData.junta_id || "",
        processo: editData.processo || "",
        data: editData.data ? new Date(editData.data).toISOString().slice(0, 16) : "",
        status: editData.status || "",
      });
    } else if (open && !editData) {
      reset({});
    }
  }, [open, editData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        user_id: user!.id,
        cliente_id: data.cliente_id,
        junta_id: data.junta_id || null,
        processo: data.processo || null,
        data: data.data ? new Date(data.data).toISOString() : null,
        status: data.status || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("compromissos").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("compromissos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compromissos"] });
      queryClient.invalidateQueries({ queryKey: ["compromissos-count"] });
      queryClient.invalidateQueries({ queryKey: ["compromissos-today"] });
      toast({ title: isEdit ? "Compromisso atualizado com sucesso!" : "Compromisso cadastrado com sucesso!" });
      reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button><Plus className="mr-1" /> Novo Compromisso</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Compromisso" : "Cadastrar Compromisso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select
              value={watch("cliente_id") || ""}
              onValueChange={(v) => {
                setValue("cliente_id", v);
                // Reset vara and processo when client changes
                setValue("junta_id", "");
                setValue("processo", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.pasta ? `${c.pasta} — ${c.nome_cliente}` : c.nome_cliente}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cliente_id && <p className="text-xs text-destructive">{errors.cliente_id.message}</p>}
          </div>

          {selectedClienteId && (
            <>
              <div className="space-y-1.5">
                <Label>Vara</Label>
                <Select
                  value={watch("junta_id") || ""}
                  onValueChange={(v) => setValue("junta_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma vara" />
                  </SelectTrigger>
                  <SelectContent>
                    {clienteVaras.map((j) => (
                      <SelectItem key={j.id} value={j.id}>{j.jcj_real}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Processo</Label>
                {clienteProcessos.length > 0 ? (
                  <Select
                    value={watch("processo") || ""}
                    onValueChange={(v) => setValue("processo", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {clienteProcessos.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input {...register("processo")} placeholder="Número do processo" />
                )}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Data/Hora</Label>
            <Input type="datetime-local" {...register("data")} />
          </div>

          <div className="space-y-1.5">
            <Label>Detalhes do Compromisso</Label>
            <Textarea
              value={watch("status") || ""}
              onChange={(e) => setValue("status", e.target.value)}
              placeholder="Descreva os detalhes do compromisso..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
