import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
