import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Flame, Target, Trophy } from "lucide-react";

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Words", value: "--", icon: BarChart3 },
          { label: "Mastered", value: "--", icon: Trophy },
          { label: "Accuracy", value: "--", icon: Target },
          { label: "Streak", value: "--", icon: Flame },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Activity heatmap and charts coming in Phase 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
