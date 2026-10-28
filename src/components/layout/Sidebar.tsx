import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  CreditCard,
  Settings,
  LogOut,
  Wallet,
  ClipboardCheck,
  Target,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePendingReviewCount } from "@/hooks/usePendingReviewCount";
import { CountBadge } from "@/components/transactions/StatusBadge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ArrowUpDown, label: "Transações", path: "/transactions" },
  { icon: ClipboardCheck, label: "Validar", path: "/review" },
  { icon: CreditCard, label: "Cartões", path: "/cards" },
  { icon: Target, label: "Metas", path: "/goals" },
  { icon: Landmark, label: "Dívidas", path: "/debts" },
  { icon: PieChart, label: "Relatórios", path: "/reports" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

export function Sidebar() {
  const { signOut, members } = useAuth();
  const pending = usePendingReviewCount();
  const items = members.length > 1 ? menuItems : menuItems.filter((i) => i.path !== "/review");

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">FinanceFlow</h1>
            <p className="text-xs text-muted-foreground">Gestão Financeira</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-secondary text-muted-foreground hover:text-foreground",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.path === "/review" && <CountBadge count={pending} />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
