import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Phone, FileText, Briefcase, DollarSign, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface ClienteDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: any;
}

const formatCurrency = (v: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

export function ClienteDetailModal({ open, onOpenChange, cliente }: ClienteDetailModalProps) {
  if (!cliente) return null;

  const fields = [
    { label: "Pasta", value: cliente.pasta, icon: FileText },
    { label: "Reclamado", value: cliente.reclamado, icon: Briefcase },
    { label: "Cargo", value: cliente.cargo, icon: Briefcase },
    { label: "Endereço", value: cliente.endereco, icon: MapPin },
    { label: "Cidade/UF", value: [cliente.cidade, cliente.estado].filter(Boolean).join("/") || null, icon: MapPin },
    { label: "CEP", value: cliente.cep, icon: MapPin },
    { label: "Telefone", value: cliente.telefone, icon: Phone },
    { label: "Valor da Causa", value: cliente.valor_da_causa != null ? formatCurrency(cliente.valor_da_causa) : null, icon: DollarSign },
    { label: "Data de Distribuição", value: cliente.data_distribuicao ? format(new Date(cliente.data_distribuicao), "dd/MM/yyyy") : null, icon: Calendar },
    { label: "Observação", value: cliente.observacao, icon: MessageSquare },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
              <span className="text-sm font-bold text-primary">
                {cliente.nome_cliente.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="block">{cliente.nome_cliente}</span>
              <span className="text-xs font-normal text-muted-foreground">
                Cadastrado em {format(new Date(cliente.created_at), "dd/MM/yyyy")}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {fields.map((f) => {
            if (!f.value) return null;
            return (
              <div key={f.label} className="flex items-start gap-3 py-2 px-3 rounded-xl bg-muted/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shrink-0 mt-0.5">
                  <f.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-medium mt-0.5 break-words">{f.value}</p>
                </div>
              </div>
            );
          })}

          {fields.every((f) => !f.value) && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma informação adicional cadastrada.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
