
// This file is being replaced by hall-of-fame-management/page.tsx
// For now, it can redirect or show a placeholder.
// Let's make it a simple placeholder to indicate it's not the primary user/HoF management anymore.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";

export default function AdminUsersLegacyPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">User Management</CardTitle>
              <CardDescription>This section is for general user account management (future feature).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            User account management functionality will be implemented here in the future.
          </p>
          <p className="text-muted-foreground mt-4">
            For Hall of Fame management, please go to the <Link href="/admin/dashboard/hall-of-fame-management" className="text-primary hover:underline">Hall of Fame Management</Link> section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
