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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Landmark } from "lucide-react";
import { VaraFormDialog } from "@/components/varas/VaraFormDialog";

const schema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  junta: z.string().optional(),
  processo: z.string().optional(),
  data_distribuicao: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AgendaFormDialogProps {
  editData?: any;
  trigger?: React.ReactNode;
}

export function AgendaFormDialog({ editData, trigger }: AgendaFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [varaMode, setVaraMode] = useState<"idle" | "existing">("idle");
  const [showVaraModal, setShowVaraModal] = useState(false);
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

  const { data: varas = [] } = useQuery({
    queryKey: ["juntas"],
    queryFn: async () => {
      const { data } = await supabase.from("juntas").select("id, jcj_real, local_real").order("jcj_real");
      return data ?? [];
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedVara = watch("junta");

  useEffect(() => {
    if (open && editData) {
      reset({
        cliente_id: editData.cliente_id || "",
        junta: editData.junta || "",
        processo: editData.processo || "",
        data_distribuicao: editData.data_distribuicao || "",
      });
      if (editData.junta) setVaraMode("existing");
    } else if (open && !editData) {
      reset();
      setVaraMode("idle");
    }
  }, [open, editData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        user_id: user!.id,
        cliente_id: data.cliente_id,
        junta: data.junta || null,
        processo: data.processo || null,
        data_distribuicao: data.data_distribuicao || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("agenda").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agenda").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-count"] });
      toast({ title: isEdit ? "Agenda atualizada com sucesso!" : "Agenda cadastrada com sucesso!" });
      reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const handleVaraCreated = (varaName: string) => {
    setValue("junta", varaName);
    setVaraMode("existing");
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button><Plus className="mr-1" /> Nova Agenda</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Agenda" : "Cadastrar Agenda"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select
              defaultValue={editData?.cliente_id}
              onValueChange={(v) => setValue("cliente_id", v)}
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

          {/* Vara Field */}
          <div className="space-y-1.5">
            <Label>Vara</Label>

            {/* Show selected vara chip if one is selected */}
            {selectedVara && varaMode !== "idle" ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
                  <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{selectedVara}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setValue("junta", "");
                    setVaraMode("idle");
                  }}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              /* Two action buttons */
              <div className="flex flex-col gap-2">
                {varaMode === "idle" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setShowVaraModal(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Inserir Vara
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setVaraMode("existing")}
                    >
                      <Landmark className="h-3 w-3 mr-1" /> Inserir Vara Existente
                    </Button>
                  </div>
                )}

                {varaMode === "existing" && (
                  <div className="space-y-2">
                    <Select
                      onValueChange={(v) => {
                        setValue("junta", v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma vara existente" />
                      </SelectTrigger>
                      <SelectContent>
                        {varas.map((v) => (
                          <SelectItem key={v.id} value={v.jcj_real}>
                            {v.jcj_real}{v.local_real ? ` — ${v.local_real}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setVaraMode("idle")}
                    >
                      ← Voltar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Processo</Label>
              <Input {...register("processo")} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Distribuição</Label>
              <Input type="date" {...register("data_distribuicao")} />
            </div>
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

    {/* Vara creation modal — rendered outside parent Dialog to prevent close propagation */}
    <VaraFormDialog
      externalOpen={showVaraModal}
      onExternalOpenChange={(v) => {
        setShowVaraModal(v);
      }}
      onCreated={(varaName) => {
        handleVaraCreated(varaName);
        setShowVaraModal(false);
      }}
    />
  </>
  );
}
