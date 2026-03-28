import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReviewSessionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
      <p className="text-muted-foreground">
        Review session UI coming in Phase 4.
      </p>
      <Button variant="outline" asChild>
        <Link href="/dashboard/review">
          <ArrowLeft className="size-4 mr-2" />
          Back to Review
        </Link>
      </Button>
    </div>
  );
}
