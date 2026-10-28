import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  CreditCard,
  LogOut,
  ClipboardCheck,
  Target,
  Landmark,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingReviewCount } from "@/hooks/usePendingReviewCount";
import { CountBadge } from "@/components/transactions/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const menuItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: ArrowUpDown, label: "Transações", path: "/transactions" },
  { icon: ClipboardCheck, label: "Validar", path: "/review" },
  { icon: CreditCard, label: "Cartões", path: "/cards" },
  { icon: Target, label: "Metas", path: "/goals" },
  { icon: Landmark, label: "Dívidas", path: "/debts" },
  { icon: PieChart, label: "Relatórios", path: "/reports" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

export function MobileNav() {
  const { signOut, members } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const pending = usePendingReviewCount();
  const items = members.length > 1 ? menuItems : menuItems.filter((i) => i.path !== "/review");
  const primary = items.filter((item) => ["/", "/transactions", "/cards"].includes(item.path));
  const secondary = items.filter((item) => !primary.includes(item));

  return (
    <nav aria-label="Navegação principal" className="mobile-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <ul className="grid grid-cols-4 items-center py-1">
        {primary.map((item) => (
          <li key={item.path} className="min-w-0">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg transition-all duration-200",
                  "text-muted-foreground",
                  isActive && "text-primary"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.path === "/review" && <CountBadge count={pending} className="absolute -top-0.5 right-0" />}
              <span className="text-xs">{item.label}</span>
            </NavLink>
          </li>
        ))}
        <li>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className={cn("relative w-full h-auto min-h-14 flex flex-col gap-1 py-2 text-muted-foreground", secondary.some((item) => item.path === pathname) && "text-primary")}>
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-xs">Mais</span>
                <CountBadge count={pending} className="absolute top-0 right-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Menu</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-1">
                {secondary.map((item) => (
                  <Button key={item.path} variant={pathname === item.path ? "secondary" : "ghost"} className="justify-start gap-3" asChild>
                    <NavLink to={item.path} onClick={() => setOpen(false)}>
                      <item.icon className="w-5 h-5" />{item.label}
                      {item.path === "/review" && <CountBadge count={pending} />}
                    </NavLink>
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => { setOpen(false); void signOut(); }} className="justify-start gap-3 text-destructive">
                  <LogOut className="w-5 h-5" />Sair
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </nav>
  );
}
