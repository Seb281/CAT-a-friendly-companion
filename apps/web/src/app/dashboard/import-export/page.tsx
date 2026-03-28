import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import / Export</h1>
        <p className="text-muted-foreground">
          Back up your vocabulary or import from other tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5 text-primary" />
              Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Export your vocabulary as CSV, JSON, or Anki-compatible format.
              Coming in Phase 6.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5 text-primary" />
              Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Import vocabulary from CSV or JSON files. Duplicates are
              automatically detected. Coming in Phase 6.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
