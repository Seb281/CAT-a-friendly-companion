import SettingsForm from "@/components/dashboard/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your translation preferences and account.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
