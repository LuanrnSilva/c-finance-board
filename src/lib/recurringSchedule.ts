import { addMonthsToDateStr, formatLocalDate, parseLocalDate } from "@/lib/utils";

export interface MonthlySchedule {
  next_date: string;
  billing_day: number;
  end_date: string | null;
  state: string;
}

export function upcomingDates(schedule: MonthlySchedule, count = 3): string[] {
  if (schedule.state !== "active") return [];
  const dates: string[] = [];
  let current = schedule.next_date;
  for (let i = 0; i < count; i++) {
    if (schedule.end_date && current > schedule.end_date) break;
    dates.push(current);
    const nextMonth = parseLocalDate(addMonthsToDateStr(current.slice(0, 7) + "-01", 1));
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    nextMonth.setDate(Math.min(schedule.billing_day, lastDay));
    current = formatLocalDate(nextMonth);
  }
  return dates;
}

export function scheduleInputError(amount: number, start: string, end: string, today: string): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Informe um valor maior que zero.";
  if (!start || start < today) return "A próxima cobrança deve ser hoje ou uma data futura.";
  if (end && end < start) return "A data final não pode ser anterior à próxima cobrança.";
  return null;
}