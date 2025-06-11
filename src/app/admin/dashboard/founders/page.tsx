
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFounders } from "@/actions/founder-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Edit, Crown, AlertTriangle, Loader2 } from "lucide-react";
import DeleteFounderButton from "./_components/DeleteFounderButton";
import type { Founder } from "@/lib/schemas/founder-schema";

export default function AdminFoundersPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    // setError(null);
    try {
      const { founders: fetchedFounders, error: fetchError } = await getFounders();
      if (fetchError) {
        setError(fetchError);
      } else {
        setFounders(fetchedFounders || []);
         if (!isInitialLoad) setError(null);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching founder profiles.");
    }
    if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true); // Initial fetch

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchData(false);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading founder profiles...</p>
      </div>
    );
  }

  if (error && founders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Founder Profiles</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && founders.length > 0 && (
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
          {founders.length === 0 && !error ? (
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
