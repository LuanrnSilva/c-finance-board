import { useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GoalFormDialog, ContributionDialog } from "@/components/goals/GoalDialogs";
import { useAuth } from "@/contexts/AuthContext";
import { cn, parseLocalDate } from "@/lib/utils";
import { monthlyNeeded, monthsRemaining, progressPct } from "@/lib/goals";
import type { useGoals, Goal } from "@/hooks/useGoals";

export const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function GoalCard({ goal, actions }: { goal: Goal; actions: ReturnType<typeof useGoals> }) {
  const { user, members } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const pct = progressPct(goal.target_amount, goal.saved);
  const monthly = monthlyNeeded(goal.target_amount, goal.saved, goal.deadline);
  const overdue = goal.deadline && monthsRemaining(goal.deadline) === 0 && goal.saved < goal.target_amount;
  const nameOf = (id: string) =>
    id === user?.id ? "Você" : members.find((m) => m.user_id === id)?.full_name || "Membro";

  return (
    <Card className={cn(goal.archived && "opacity-70")}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-lg">{goal.name}</CardTitle>
          {goal.deadline && (
            <p className={cn("text-sm", overdue ? "text-destructive" : "text-muted-foreground")}>
              Prazo: {parseLocalDate(goal.deadline).toLocaleDateString("pt-BR")}{overdue && " (vencido)"}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <GoalFormDialog
            goal={goal}
            onSubmit={(input) => actions.updateGoal.mutateAsync({ id: goal.id, ...input })}
            trigger={<Button variant="ghost" size="icon" aria-label="Editar meta"><Pencil className="w-4 h-4" /></Button>}
          />
          <Button
            variant="ghost" size="icon"
            aria-label={goal.archived ? "Desarquivar meta" : "Arquivar meta"}
            onClick={() => actions.updateGoal.mutate({ id: goal.id, archived: !goal.archived })}
          >
            {goal.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Excluir meta" className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                <AlertDialogDescription>"{goal.name}" e todos os aportes serão apagados. Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => actions.deleteGoal.mutate(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{brl(goal.saved)} <span className="text-sm font-normal text-muted-foreground">de {brl(goal.target_amount)}</span></p>
          <span className="text-sm font-semibold text-primary">{pct.toFixed(0)}%</span>
        </div>
        <Progress value={pct} />
        {monthly !== null && (
          <p className="text-sm text-muted-foreground">
            Valor mensal necessário: <span className="font-semibold text-foreground">{brl(monthly)}</span>
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {!goal.archived && <ContributionDialog goal={goal} onSubmit={(i) => actions.addContribution.mutateAsync(i)} />}
          <Button variant="ghost" size="sm" onClick={() => setShowHistory((s) => !s)} className="ml-auto">
            Histórico ({goal.contributions.length}) {showHistory ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
        {showHistory && (
          <div className="space-y-2 border-t border-border pt-3">
            {goal.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum aporte ainda.</p>
            ) : goal.contributions.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    {nameOf(c.created_by)} • {parseLocalDate(c.date).toLocaleDateString("pt-BR")}
                  </p>
                  {c.note && <p className="text-xs text-muted-foreground truncate">{c.note}</p>}
                </div>
                <span className={cn("font-semibold whitespace-nowrap", c.amount < 0 ? "text-destructive" : "text-success")}>
                  {c.amount > 0 ? "+" : ""}{brl(c.amount)}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Excluir aporte" onClick={() => actions.deleteContribution.mutate(c.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
