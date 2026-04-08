import {
  endOfDay,
  startOfDay,
  subDays,
  subYears,
} from "date-fns";
import type { DateFilter } from "@/store/use-app-store";
import type { CheckIn } from "@/types/models";

export function filterCheckInsByDate(
  items: CheckIn[],
  filter: DateFilter,
  custom: { start: number; end: number } | null,
): CheckIn[] {
  const now = Date.now();
  if (filter === "all") return items;
  if (filter === "7d") {
    const t = subDays(now, 7).getTime();
    return items.filter((c) => c.checkedAt >= t);
  }
  if (filter === "30d") {
    const t = subDays(now, 30).getTime();
    return items.filter((c) => c.checkedAt >= t);
  }
  if (filter === "year") {
    const t = subYears(now, 1).getTime();
    return items.filter((c) => c.checkedAt >= t);
  }
  if (filter === "custom" && custom) {
    const a = startOfDay(custom.start).getTime();
    const b = endOfDay(custom.end).getTime();
    return items.filter((c) => c.checkedAt >= a && c.checkedAt <= b);
  }
  return items;
}
