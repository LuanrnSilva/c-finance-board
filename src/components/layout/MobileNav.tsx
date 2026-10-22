import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  CreditCard,
  LogOut,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingReviewCount } from "@/hooks/usePendingReviewCount";
import { CountBadge } from "@/components/transactions/StatusBadge";

const menuItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: ArrowUpDown, label: "Transações", path: "/transactions" },
  { icon: ClipboardCheck, label: "Validar", path: "/review" },
  { icon: CreditCard, label: "Cartões", path: "/cards" },
  { icon: PieChart, label: "Relatórios", path: "/reports" },
];

export function MobileNav() {
  const { signOut, members } = useAuth();
  const pending = usePendingReviewCount();
  const items = members.length > 1 ? menuItems : menuItems.filter((i) => i.path !== "/review");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <ul className="flex items-center justify-around py-2">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
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
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Sair</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
