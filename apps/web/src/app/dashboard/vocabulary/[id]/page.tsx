import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vocabulary">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Concept Detail
          </h1>
          <p className="text-muted-foreground">Concept #{id}</p>
        </div>
      </div>
      <p className="text-muted-foreground">
        Full concept view with notes, tags, and SRS info coming in Phase 2.
      </p>
    </div>
  );
}
