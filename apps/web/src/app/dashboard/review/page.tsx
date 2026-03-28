import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ListChecks, Keyboard } from "lucide-react";

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review</h1>
        <p className="text-muted-foreground">
          Choose a study mode and start practicing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="size-5 text-primary" />
              Flashcards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Classic card flip. See the word, recall the translation, then rate
              your confidence.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="size-5 text-primary" />
              Multiple Choice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pick the correct translation from four options. Great for
              recognition practice.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Keyboard className="size-5 text-primary" />
              Type Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Type the translation from memory. Tests active recall and
              spelling.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Review modes will be fully functional in Phase 4.
      </p>
    </div>
  );
}
