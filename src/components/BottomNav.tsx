import { LayoutDashboard, Users, Calendar, Landmark, ClipboardList, MessageSquareText } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Varas", url: "/varas", icon: Landmark },
  { title: "Compromissos", url: "/compromissos", icon: ClipboardList },
  { title: "Respostas", url: "/respostas", icon: MessageSquareText },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg text-muted-foreground transition-all duration-200 min-w-[3.5rem]",
                isActive && "text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-200",
                    isActive && "bg-primary/10 scale-110"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.5]")} />
                </div>
                <span className={cn("text-[10px] leading-tight", isActive ? "font-semibold" : "font-medium")}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Safe area spacer for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
