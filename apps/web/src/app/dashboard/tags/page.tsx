import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tags } from "lucide-react";

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">
          Organize your vocabulary by topic.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="size-5 text-primary" />
            Your Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Tag management coming in Phase 3. You&apos;ll be able to create tags
            like &quot;Food&quot;, &quot;Travel&quot;, &quot;Work&quot; and assign them to your vocabulary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
