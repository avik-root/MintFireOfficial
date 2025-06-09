
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFounders } from "@/actions/founder-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Edit, Crown, AlertTriangle } from "lucide-react";
import DeleteFounderButton from "./_components/DeleteFounderButton";
import type { Founder } from "@/lib/schemas/founder-schema";

export default async function AdminFoundersPage() {
  const { founders, error } = await getFounders();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Founder Profiles</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!founders) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Crown className="w-16 h-16 mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Loading founder profiles...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <Crown className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Founder Profiles
              </CardTitle>
              <CardDescription>Add, edit, or delete founder profiles.</CardDescription>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/admin/dashboard/founders/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Founder Profile
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {founders.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No founder profiles found.</p>
              <p className="text-muted-foreground">Get started by adding a founder profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Photo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {founders.map((founder: Founder) => (
                    <tr key={founder.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border">
                          <Image 
                            src={founder.imageUrl || `https://placehold.co/40x40.png?text=${founder.name.charAt(0)}`} 
                            alt={founder.name} 
                            fill
                            className="object-cover"
                            data-ai-hint="founder photo"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{founder.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{founder.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{founder.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Edit Founder Profile">
                          <Link href={`/admin/dashboard/founders/edit/${founder.id}`}>
                            <Edit className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        <DeleteFounderButton founderId={founder.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
