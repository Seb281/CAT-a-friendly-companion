"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ActivityDay = {
  date: string;
  conceptsAdded: number;
  reviewsCompleted: number;
  correctReviews: number;
};

type ActivityHeatmapProps = {
  activity: ActivityDay[];
  days?: number;
};

function getIntensity(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-emerald-500/20";
  if (count <= 5) return "bg-emerald-500/40";
  if (count <= 10) return "bg-emerald-500/60";
  return "bg-emerald-500";
}

export default function ActivityHeatmap({
  activity,
  days = 90,
}: ActivityHeatmapProps) {
  // Build a map of date -> activity
  const activityMap = new Map<string, ActivityDay>();
  for (const a of activity) {
    activityMap.set(a.date, a);
  }

  // Generate all dates for the grid
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Group by weeks for the grid (7 rows = days of week)
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  // Pad the first week so the grid aligns to weekday columns
  const firstDate = new Date(dates[0]!);
  const startDay = firstDate.getDay(); // 0=Sun
  for (let i = 0; i < startDay; i++) {
    currentWeek.push("");
  }

  for (const date of dates) {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-2">
        {/* Day labels */}
        <div className="flex gap-[3px]">
          <div className="w-7 shrink-0" />
          {/* Week columns - just spacers for alignment */}
        </div>

        <div className="flex gap-[3px]">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground w-7 shrink-0">
            <span className="h-[13px]" />
            <span className="h-[13px] leading-[13px]">Mon</span>
            <span className="h-[13px]" />
            <span className="h-[13px] leading-[13px]">Wed</span>
            <span className="h-[13px]" />
            <span className="h-[13px] leading-[13px]">Fri</span>
            <span className="h-[13px]" />
          </div>

          {/* Grid */}
          <div className="flex gap-[3px] overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((date, di) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${di}`}
                        className="size-[13px]"
                      />
                    );
                  }

                  const a = activityMap.get(date);
                  const total =
                    (a?.conceptsAdded ?? 0) + (a?.reviewsCompleted ?? 0);

                  return (
                    <Tooltip key={date}>
                      <TooltipTrigger asChild>
                        <div
                          className={`size-[13px] rounded-sm ${getIntensity(total)} transition-colors`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{date}</p>
                        {a ? (
                          <>
                            <p>{a.conceptsAdded} words added</p>
                            <p>{a.reviewsCompleted} reviews</p>
                          </>
                        ) : (
                          <p>No activity</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end">
          <span>Less</span>
          <div className="size-[10px] rounded-sm bg-muted" />
          <div className="size-[10px] rounded-sm bg-emerald-500/20" />
          <div className="size-[10px] rounded-sm bg-emerald-500/40" />
          <div className="size-[10px] rounded-sm bg-emerald-500/60" />
          <div className="size-[10px] rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
