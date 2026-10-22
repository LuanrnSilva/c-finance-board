import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalFormDialog } from "@/components/goals/GoalDialogs";
import { useGoals } from "@/hooks/useGoals";

export default function Goals() {
  const actions = useGoals();
  const [showArchived, setShowArchived] = useState(false);
  const active = actions.goals.filter((g) => !g.archived);
  const archived = actions.goals.filter((g) => g.archived);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metas</h1>
            <p className="text-muted-foreground">Acompanhe o quanto falta para cada objetivo</p>
          </div>
          <GoalFormDialog
            onSubmit={(input) => actions.createGoal.mutateAsync(input)}
            trigger={<Button><Plus className="w-4 h-4 mr-2" />Nova meta</Button>}
          />
        </div>

        {actions.loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : active.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Nenhuma meta ativa. Crie a primeira!</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {active.map((g) => <GoalCard key={g.id} goal={g} actions={actions} />)}
          </div>
        )}

        {archived.length > 0 && (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setShowArchived((s) => !s)}>
              {showArchived ? "Ocultar" : "Mostrar"} arquivadas ({archived.length})
            </Button>
            {showArchived && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {archived.map((g) => <GoalCard key={g.id} goal={g} actions={actions} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
