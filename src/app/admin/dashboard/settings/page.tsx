
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminProfile } from "@/actions/admin-actions";
import AdminProfileForm from "./_components/AdminProfileForm";
import { Settings as SettingsIcon, AlertTriangle, Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const { admin, error } = await getAdminProfile();

  if (error) {
    // This could happen if admin.json is missing or corrupt, or no admin exists.
    // For now, we'll show an error, but a robust app might redirect to login or setup.
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
        <div className="text-center mb-12">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-4xl font-bold font-headline mb-2 text-destructive">Error</h1>
          <p className="text-lg text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Please ensure an admin account exists and the data files are accessible.</p>
        </div>
      </div>
    );
  }
  
  if (!admin) {
    // Should ideally not happen if checkAdminExists is used before allowing access to dashboard.
    // But as a safeguard, or if admin.json gets deleted.
     return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
        <div className="text-center mb-12">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h1 className="text-4xl font-bold font-headline mb-2">Loading Admin Data...</h1>
          <p className="text-lg text-muted-foreground">If this persists, the admin account might not be set up correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
       <div className="mb-8">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-10 h-10 text-primary glowing-icon-primary" />
          <div>
            <h1 className="font-headline text-4xl font-bold">Admin Settings</h1>
            <p className="text-muted-foreground">Manage your administrator profile and password.</p>
          </div>
        </div>
      </div>
      <AdminProfileForm admin={admin} />
    </div>
  );
}
