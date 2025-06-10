
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteContentItems } from "@/actions/site-content-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Edit, ExternalLink, AlertTriangle, ListChecks, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteSiteContentItemButton from "./_components/DeleteSiteContentItemButton";
import type { SiteContentItem } from "@/lib/schemas/site-content-schemas";

export default function AdminSiteContentPage() {
  const [siteContentItems, setSiteContentItems] = useState<SiteContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    // setError(null);
    try {
      const { items, error: fetchError } = await getSiteContentItems();
      if (fetchError) {
        setError(fetchError);
      } else {
        // Filter for announcements only on the client, though schema should enforce this for new items
        setSiteContentItems(items?.filter(item => item.type === 'announcement') || []);
         if (!isInitialLoad) setError(null);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching site content.");
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
        <p className="text-muted-foreground">Loading site content...</p>
      </div>
    );
  }

  if (error && siteContentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Site Content</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && siteContentItems.length > 0 && (
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
                <ListChecks className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Announcements
              </CardTitle>
              <CardDescription>View, add, edit, or delete site announcements.</CardDescription>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/admin/dashboard/site-content/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Announcement
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {siteContentItems.length === 0 && !error ? (
            <div className="text-center py-12">
              <ListChecks className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No announcements found.</p>
              <p className="text-muted-foreground">Get started by adding a new announcement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {siteContentItems.map((item: SiteContentItem) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{item.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <Badge variant={'outline'} className="capitalize">{item.type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={item.isActive ? "default" : "destructive"} className={item.isActive ? "bg-green-600/30 text-green-400 border-green-500" : "bg-red-600/30 text-red-400 border-red-500"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        {item.linkUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" title="View Live">
                              <ExternalLink className="h-4 w-4 text-blue-500" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild title="Edit Item">
                          <Link href={`/admin/dashboard/site-content/edit/${item.id}`}>
                            <Edit className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        <DeleteSiteContentItemButton itemId={item.id} />
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
