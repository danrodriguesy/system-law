import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const schema = z.object({
  compromisso_id: z.string().min(1, "Selecione um compromisso"),
  cliente_id: z.string().min(1, "Selecione um cliente"),
  descricao_resposta: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RespostaFormDialogProps {
  editData?: any;
  trigger?: React.ReactNode;
}

export function RespostaFormDialog({ editData, trigger }: RespostaFormDialogProps) {
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

  const { data: compromissos = [] } = useQuery({
    queryKey: ["compromissos-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("compromissos")
        .select("id, processo, clientes(nome_cliente)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        compromisso_id: editData.compromisso_id || "",
        cliente_id: editData.cliente_id || "",
        descricao_resposta: editData.descricao_resposta || "",
      });
    } else if (open && !editData) {
      reset();
    }
  }, [open, editData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        user_id: user!.id,
        compromisso_id: data.compromisso_id,
        cliente_id: data.cliente_id,
        descricao_resposta: data.descricao_resposta || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("respostas_compromisso").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("respostas_compromisso").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["respostas"] });
      queryClient.invalidateQueries({ queryKey: ["respostas-count"] });
      toast({ title: isEdit ? "Resposta atualizada com sucesso!" : "Resposta cadastrada com sucesso!" });
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
          <Button><Plus className="mr-1" /> Nova Resposta</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Resposta" : "Cadastrar Resposta"}</DialogTitle>
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
          <div className="space-y-1.5">
            <Label>Compromisso *</Label>
            <Select
              defaultValue={editData?.compromisso_id}
              onValueChange={(v) => setValue("compromisso_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um compromisso" />
              </SelectTrigger>
              <SelectContent>
                {compromissos.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {(comp.clientes as any)?.nome_cliente || "Cliente"} — {comp.processo || "Sem processo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.compromisso_id && <p className="text-xs text-destructive">{errors.compromisso_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Descrição da Resposta</Label>
            <Textarea
              rows={4}
              placeholder="Descreva a resposta do compromisso..."
              {...register("descricao_resposta")}
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
