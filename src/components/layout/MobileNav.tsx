import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: ArrowUpDown, label: "Transações", path: "/transactions" },
  { icon: CreditCard, label: "Cartões", path: "/cards" },
  { icon: PieChart, label: "Relatórios", path: "/reports" },
];

export function MobileNav() {
  const { signOut } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <ul className="flex items-center justify-around py-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  "text-muted-foreground",
                  isActive && "text-primary"
                )
              }
            >
              <item.icon className="w-5 h-5" />
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
