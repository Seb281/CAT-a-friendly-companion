import { BookOpen, GraduationCap, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Welcome back. Here&apos;s your learning overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Due for Review */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start a review session to practice your vocabulary with flashcards and quizzes.
            </p>
            <Button asChild>
              <Link href="/dashboard/review">
                Start Review
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Total Words</p>
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Mastered</p>
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Words placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Recent Words
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/vocabulary">
                View all
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your recently saved words will appear here. Use the extension to translate and save new vocabulary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
