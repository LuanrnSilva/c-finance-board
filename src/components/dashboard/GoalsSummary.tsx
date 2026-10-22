import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/useGoals";
import { progressPct } from "@/lib/goals";
import { brl } from "@/components/goals/GoalCard";

export function GoalsSummary() {
  const { goals, loading } = useGoals();
  const top = goals
    .filter((g) => !g.archived)
    .map((g) => ({ ...g, pct: progressPct(g.target_amount, g.saved) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Metas</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild><Link to="/goals">Ver todas</Link></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? null : top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta ainda. <Link to="/goals" className="text-primary underline">Criar meta</Link></p>
        ) : top.map((g) => (
          <div key={g.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate">{g.name}</span>
              <span className="text-muted-foreground whitespace-nowrap">{brl(g.saved)} / {brl(g.target_amount)} • {g.pct.toFixed(0)}%</span>
            </div>
            <Progress value={g.pct} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
