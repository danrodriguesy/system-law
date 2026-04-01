import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Scale, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { format, startOfDay, endOfDay, isBefore, startOfHour } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

  const { data: compromissosRaw = [] } = useQuery({
    queryKey: ["compromissos-today"],
    queryFn: async () => {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      const { data } = await supabase
        .from("compromissos")
        .select("id, processo, data, status, cliente_id, clientes(nome_cliente, pasta)")
        .gte("data", start.toISOString())
        .lte("data", end.toISOString())
        .order("data", { ascending: true })
        .limit(20);
      return data ?? [];
    },
  });

  // Ordenar compromissos: mais próximo do horário atual primeiro
  const compromissosToday = [...compromissosRaw].sort((a, b) => {
    const now = new Date();
    const aTime = new Date(a.data!).getTime();
    const bTime = new Date(b.data!).getTime();
    const aDiff = Math.abs(aTime - now.getTime());
    const bDiff = Math.abs(bTime - now.getTime());
    return aDiff - bDiff;
  });

  // Verificar se compromisso já passou (hoje)
  const isPastToday = (data: string | null) => {
    if (!data) return false;
    const now = new Date();
    const compromissoDate = new Date(data);
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    return isBefore(compromissoDate, now) && 
           compromissoDate >= todayStart && 
           compromissoDate <= todayEnd;
  };

  const statusColor = (s: string | null, isPast: boolean) => {
    if (isPast && s !== "concluido" && s !== "cancelado") {
      return "bg-red-50 text-red-700 border-red-200 animate-pulse";
    }
    switch (s) {
      case "concluido": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelado": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3.5 mb-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Olá, {userName}</h1>
            <p className="text-muted-foreground text-sm">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Today Appointments */}
      <div className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-base">Compromissos de Hoje</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Agendamentos do dia</p>
          </div>
          <button
            onClick={() => navigate("/compromissos")}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {compromissosToday.length > 0 ? (
          <div className="space-y-1">
            {compromissosToday.map((c) => {
              const isPast = isPastToday(c.data);
              return (
                <div key={c.id} className={`flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl transition-colors ${isPast && c.status !== "concluido" && c.status !== "cancelado" ? "bg-red-50/50 hover:bg-red-100/50" : "hover:bg-muted/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isPast && c.status !== "concluido" && c.status !== "cancelado" ? "bg-red-100" : "bg-muted/80"}`}>
                      {isPast && c.status !== "concluido" && c.status !== "cancelado" ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{(c.clientes as any)?.nome_cliente || c.processo || "Sem processo"}</p>
                        {(c.clientes as any)?.pasta && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium">
                            {(c.clientes as any)?.pasta}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isPast && c.status !== "concluido" && c.status !== "cancelado" ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {c.data ? format(new Date(c.data), "dd/MM 'às' HH:mm", { locale: ptBR }) : "Sem data"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${statusColor(c.status, isPast)}`}>
                    {(c.status || "pendente").charAt(0).toUpperCase() + (c.status || "pendente").slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum compromisso hoje</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
