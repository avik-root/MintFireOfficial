
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicants } from "@/actions/applicant-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Eye, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Applicant } from "@/lib/schemas/applicant-schemas";

export default async function AdminApplicantsPage() {
  const { applicants, error } = await getApplicants();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Applicants</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!applicants) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Briefcase className="w-16 h-16 mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Loading applicants...</p>
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
                <Briefcase className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Applicants
              </CardTitle>
              <CardDescription>View and manage job applications.</CardDescription>
            </div>
            {/* No "Add Applicant" button as applications come from public form */}
          </div>
        </CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No applicants found.</p>
              <p className="text-muted-foreground">Applications submitted through the careers page will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Position Applied For</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied At</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {applicants.map((applicant: Applicant) => (
                    <tr key={applicant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{applicant.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{applicant.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{applicant.positionAppliedFor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={
                            applicant.status === 'Hired' ? 'default' :
                            applicant.status === 'Rejected' ? 'destructive' :
                            applicant.status === 'Pending' || applicant.status === 'On Hold' ? 'secondary' :
                            'outline' 
                        } className="capitalize">
                          {applicant.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(applicant.appliedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="icon" asChild title="View Details">
                          <Link href={`/admin/dashboard/applicants/${applicant.id}`}>
                            <Eye className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        {/* Delete functionality might be added later if needed */}
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
