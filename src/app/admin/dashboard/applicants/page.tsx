
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicants } from "@/actions/applicant-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Eye, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Applicant } from "@/lib/schemas/applicant-schemas";

export default function AdminApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    // For subsequent polls, we don't want to flash the error message if data is already there
    // setError(null); 
    try {
      const { applicants: fetchedApplicants, error: fetchError } = await getApplicants();
      if (fetchError) {
        setError(fetchError);
      } else {
        setApplicants(fetchedApplicants || []);
        if (!isInitialLoad) setError(null); // Clear error on successful poll
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching applicants.");
    }
    if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true); // Initial fetch

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchData(false);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading applicants...</p>
      </div>
    );
  }

  if (error && applicants.length === 0) { // Only show full page error if no data is currently displayed
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Applicants</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && applicants.length > 0 && ( // Show a less intrusive error if data is already displayed
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
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
          </div>
        </CardHeader>
        <CardContent>
          {applicants.length === 0 && !error ? (
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
