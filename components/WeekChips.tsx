"use client";

import { ALL_WEEKS } from "@/lib/week";

export function WeekChips({
  visibleWeeks,
  onChange,
}: {
  visibleWeeks: string[];
  onChange: (weeks: string[]) => void;
}) {
  const allSelected = visibleWeeks.length === 0;

  function toggleWeek(week: string) {
    if (allSelected) {
      // Isolate: clicking a single week while "All weeks" is active selects only that week.
      onChange([week]);
      return;
    }
    if (visibleWeeks.includes(week)) {
      const next = visibleWeeks.filter((w) => w !== week);
      onChange(next);
    } else {
      const next = [...visibleWeeks, week];
      onChange(next.length === ALL_WEEKS.length ? [] : next);
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange([])}
        className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide transition ${
          allSelected
            ? "border-brass bg-brass text-white"
            : "border-rule-strong text-ink-soft hover:border-brass"
        }`}
      >
        All weeks
      </button>
      {ALL_WEEKS.map((week) => {
        const active = allSelected || visibleWeeks.includes(week);
        return (
          <button
            key={week}
            onClick={() => toggleWeek(week)}
            className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide transition ${
              active
                ? "border-brass bg-brass text-white"
                : "border-rule-strong text-ink-soft hover:border-brass"
            }`}
          >
            {week}
          </button>
        );
      })}
    </div>
  );
}
