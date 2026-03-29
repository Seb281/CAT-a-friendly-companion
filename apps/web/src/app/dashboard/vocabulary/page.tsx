import ConceptsList from "@/components/dashboard/ConceptsList";

export default function VocabularyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vocabulary</h1>
        <p className="text-muted-foreground">
          Manage your saved words and phrases.
        </p>
      </div>
      <ConceptsList />
    </div>
  );
}
