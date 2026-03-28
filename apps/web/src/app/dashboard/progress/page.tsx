"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Flame, Target, Trophy, BookOpen, Loader2 } from "lucide-react";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";

type OverviewStats = {
  totalConcepts: number;
  currentStreak: number;
  longestStreak: number;
  avgAccuracy: number;
  conceptsByState: Record<string, number>;
};

type ActivityDay = {
  date: string;
  conceptsAdded: number;
  reviewsCompleted: number;
  correctReviews: number;
};

const STATE_COLORS: Record<string, string> = {
  new: "bg-gray-400",
  learning: "bg-blue-500",
  familiar: "bg-amber-500",
  mastered: "bg-green-500",
};

const STATE_LABELS: Record<string, string> = {
  new: "New",
  learning: "Learning",
  familiar: "Familiar",
  mastered: "Mastered",
};

export default function ProgressPage() {
  const supabase = createClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${session.access_token}` };

        const [overviewRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/stats/overview`, { headers }),
          fetch(`${API_URL}/stats/activity?days=90`, { headers }),
        ]);

        if (overviewRes.ok) {
          setOverview(await overviewRes.json());
        }
        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivity(data.activity);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [supabase, API_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const states = ["new", "learning", "familiar", "mastered"];
  const totalForBar = overview?.totalConcepts ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">Track your learning journey.</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Words
            </CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {overview?.totalConcepts ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mastered
            </CardTitle>
            <Trophy className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {overview?.conceptsByState?.mastered ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accuracy
            </CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {overview?.avgAccuracy ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Streak
            </CardTitle>
            <Flame className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {overview?.currentStreak ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                days
              </span>
            </p>
            {overview && overview.longestStreak > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Best: {overview.longestStreak} days
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vocabulary breakdown */}
      {totalForBar > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Vocabulary Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="flex h-4 rounded-full overflow-hidden">
              {states.map((state) => {
                const count = overview?.conceptsByState?.[state] ?? 0;
                const pct = totalForBar > 0 ? (count / totalForBar) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={state}
                    className={`${STATE_COLORS[state]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
              {states.map((state) => {
                const count = overview?.conceptsByState?.[state] ?? 0;
                return (
                  <div key={state} className="flex items-center gap-2">
                    <span
                      className={`size-3 rounded-full ${STATE_COLORS[state]}`}
                    />
                    <span className="text-sm">
                      {STATE_LABELS[state]}{" "}
                      <span className="text-muted-foreground font-medium">
                        {count}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap activity={activity} days={90} />
        </CardContent>
      </Card>
    </div>
  );
}
