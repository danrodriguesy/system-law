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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const clienteSchema = z.object({
  pasta: z.string().optional(),
  nome_cliente: z.string().min(1, "Nome é obrigatório").max(200),
  reclamado: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  observacao: z.string().optional(),
  cargo: z.string().optional(),
  valor_da_causa: z.string().optional(),
  data_distribuicao: z.string().optional(),
});

type ClienteForm = z.infer<typeof clienteSchema>;

interface ClienteFormDialogProps {
  editData?: any;
  trigger?: React.ReactNode;
}

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

export function ClienteFormDialog({ editData, trigger }: ClienteFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  });

  // Populate form when editing
  useEffect(() => {
    if (open && editData) {
      reset({
        pasta: editData.pasta || "",
        nome_cliente: editData.nome_cliente || "",
        reclamado: editData.reclamado || "",
        endereco: editData.endereco || "",
        cidade: editData.cidade || "",
        estado: editData.estado || "",
        cep: editData.cep || "",
        telefone: editData.telefone || "",
        observacao: editData.observacao || "",
        cargo: editData.cargo || "",
        valor_da_causa: editData.valor_da_causa?.toString() || "",
        data_distribuicao: editData.data_distribuicao || "",
      });
    } else if (open && !editData) {
      reset();
    }
  }, [open, editData, reset]);

  // CEP auto-fill
  const cepValue = watch("cep");
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

  const mutation = useMutation({
    mutationFn: async (data: ClienteForm) => {
      const payload = {
        user_id: user!.id,
        pasta: data.pasta || null,
        nome_cliente: data.nome_cliente,
        reclamado: data.reclamado || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        telefone: data.telefone || null,
        observacao: data.observacao || null,
        cargo: data.cargo || null,
        valor_da_causa: data.valor_da_causa ? parseFloat(data.valor_da_causa) : null,
        data_distribuicao: data.data_distribuicao || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-count"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-recent"] });
      toast({ title: isEdit ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!" });
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
          <Button>
            <Plus className="mr-1" /> Novo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
              <Input id="nome_cliente" {...register("nome_cliente")} />
              {errors.nome_cliente && <p className="text-xs text-destructive">{errors.nome_cliente.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pasta">Pasta</Label>
              <Input id="pasta" {...register("pasta")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reclamado">Reclamado</Label>
              <Input id="reclamado" {...register("reclamado")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" {...register("cargo")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
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
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={watch("telefone") || ""}
                onChange={(e) => setValue("telefone", formatTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...register("endereco")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register("cidade")} />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Select
                value={watch("estado") || ""}
                onValueChange={(v) => setValue("estado", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor_da_causa">Valor da Causa</Label>
              <Input id="valor_da_causa" type="number" step="0.01" {...register("valor_da_causa")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_distribuicao">Data de Distribuição</Label>
              <Input id="data_distribuicao" type="date" {...register("data_distribuicao")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea id="observacao" {...register("observacao")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
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
