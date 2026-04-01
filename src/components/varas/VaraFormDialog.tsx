import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const formatCep = (value: string) => {
  const nums = value.replace(/\D/g, "").slice(0, 8);
  if (nums.length > 5) return `${nums.slice(0, 5)}-${nums.slice(5)}`;
  return nums;
};

const formatTelefone = (value: string) => {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length > 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  if (nums.length > 6) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  if (nums.length > 2) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return nums;
};

const schema = z.object({
  jcj_real: z.string().min(1, "Nome da Vara é obrigatório"),
  local_real: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface VaraFormDialogProps {
  editData?: any;
  trigger?: React.ReactNode;
  onCreated?: (varaName: string) => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function VaraFormDialog({ editData, trigger, onCreated, externalOpen, onExternalOpenChange }: VaraFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const controlled = externalOpen !== undefined;
  const open = controlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (controlled) {
      onExternalOpenChange?.(v);
    } else {
      setInternalOpen(v);
    }
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const cepValue = watch("cep");

  // Auto-fill via CEP
  useEffect(() => {
    const rawCep = cepValue?.replace(/\D/g, "");
    if (rawCep && rawCep.length === 8) {
      setCepLoading(true);
      fetch(`https://viacep.com.br/ws/${rawCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setValue("endereco", data.logradouro || "");
            setValue("cidade", data.localidade || "");
            setValue("estado", data.uf || "");
          }
        })
        .catch(() => {})
        .finally(() => setCepLoading(false));
    }
  }, [cepValue, setValue]);

  useEffect(() => {
    if (open && editData) {
      reset({
        jcj_real: editData.jcj_real || "",
        local_real: editData.local_real || "",
        endereco: editData.endereco || "",
        cidade: editData.cidade || "",
        estado: editData.estado || "",
        cep: editData.cep || "",
        telefone: editData.telefone || "",
      });
    } else if (open && !editData) {
      reset();
    }
  }, [open, editData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        user_id: user!.id,
        jcj_real: data.jcj_real,
        local_real: data.local_real || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        telefone: data.telefone || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("juntas").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("juntas").insert(payload);
        if (error) throw error;
      }
      return data.jcj_real;
    },
    onSuccess: (varaName) => {
      queryClient.invalidateQueries({ queryKey: ["juntas"] });
      queryClient.invalidateQueries({ queryKey: ["juntas-count"] });
      toast({ title: isEdit ? "Vara atualizada com sucesso!" : "Vara cadastrada com sucesso!" });
      reset();
      setOpen(false);
      if (!isEdit && onCreated) {
        onCreated(varaName);
      }
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button><Plus className="mr-1" /> Nova Vara</Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Vara" : "Cadastrar Vara"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome da Vara *</Label>
              <Input {...register("jcj_real")} />
              {errors.jcj_real && <p className="text-xs text-destructive">{errors.jcj_real.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Local</Label>
              <Input {...register("local_real")} />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={watch("cep") || ""}
                  onChange={(e) => setValue("cep", formatCep(e.target.value))}
                  placeholder="00000-000"
                />
                {cepLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {errors.cep && <p className="text-xs text-destructive">{errors.cep.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={watch("telefone") || ""}
                onChange={(e) => setValue("telefone", formatTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Endereço</Label>
              <Input {...register("endereco")} />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input {...register("cidade")} />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Input maxLength={2} {...register("estado")} />
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
  );
}
