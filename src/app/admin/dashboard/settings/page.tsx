
"use client"; // Make this a client component to manage state and re-fetch

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminProfile } from "@/actions/admin-actions";
import AdminProfileForm from "./_components/AdminProfileForm";
import { Settings as SettingsIcon, AlertTriangle, Loader2 } from "lucide-react";
import type { AdminProfile } from '@/lib/schemas/admin-schemas'; // Import type

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminProfile(); // Get the whole result first

      if (result && result.admin) { // Then check its properties
        setAdmin(result.admin);
      } else if (result && result.error) {
        setError(result.error);
        setAdmin(null);
      } else {
        // This case covers result being undefined, or result being an object but not having admin/error
        setError("Admin profile data is missing or incomplete. The getAdminProfile function might have returned an unexpected value.");
        setAdmin(null);
      }
    } catch (e: any) {
      // This catch block handles errors if getAdminProfile itself throws an unhandled exception
      // or if the promise returned by getAdminProfile is rejected.
      console.error("Error directly from getAdminProfile call:", e);
      setError(e.message || "An unexpected error occurred while fetching the admin profile.");
      setAdmin(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
        <div className="text-center mb-12">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h1 className="font-headline text-4xl font-bold mb-2">Loading Admin Settings...</h1>
        </div>
      </div>
    );
  }
  
  if (error || !admin) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center">
        <div className="text-center mb-12">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-headline text-4xl font-bold mb-2 text-destructive">Error</h1>
          <p className="text-lg text-muted-foreground">{error || "Admin profile could not be loaded."}</p>
          <p className="text-sm text-muted-foreground mt-2">Please ensure an admin account exists and the data files are accessible.</p>
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
            <p className="text-muted-foreground">Manage your administrator profile, password, and 2FA settings.</p>
          </div>
        </div>
      </div>
      <AdminProfileForm admin={admin} onProfileUpdate={fetchAdminData} />
    </div>
  );
}
