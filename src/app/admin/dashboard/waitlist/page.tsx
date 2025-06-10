
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWaitlistEntriesByProduct } from "@/actions/waitlist-actions";
import type { WaitlistEntry } from "@/lib/schemas/waitlist-schemas";
import { ListPlus, User, Mail, Phone, CalendarDays, Package, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';

interface GroupedWaitlistEntries {
  [productId: string]: {
    productName: string;
    entries: WaitlistEntry[];
  };
}

export default function AdminWaitlistPage() {
  const [groupedEntries, setGroupedEntries] = useState<GroupedWaitlistEntries>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const result = await getWaitlistEntriesByProduct();
      if (result.groupedEntries) {
        setGroupedEntries(result.groupedEntries);
        if (!isInitialLoad) setError(null);
      } else {
        setError(result.error || "Failed to load waitlist entries.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching waitlist entries.");
    }
    if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true);
    const intervalId = setInterval(() => {
      if (!document.hidden) fetchData(false);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const sortedProductIds = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => 
      groupedEntries[a].productName.localeCompare(groupedEntries[b].productName)
    );
  }, [groupedEntries]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading waitlist entries...</p>
      </div>
    );
  }

  if (error && Object.keys(groupedEntries).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Waitlist</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && Object.keys(groupedEntries).length > 0 && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ListPlus className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Product Waitlist Signups</CardTitle>
              <CardDescription>Review users who have joined the waitlist for upcoming products.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedProductIds.length === 0 && !error ? (
            <div className="text-center py-12">
              <Package className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No waitlist signups yet.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {sortedProductIds.map((productId) => {
                const productGroup = groupedEntries[productId];
                return (
                  <AccordionItem value={productId} key={productId}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 rounded-md text-lg font-semibold">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-accent" />
                        {productGroup.productName} 
                        <Badge variant="secondary" className="ml-2">{productGroup.entries.length} interested</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 py-2">
                      {productGroup.entries.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-card">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Signed Up</th>
                              </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                              {productGroup.entries.map((entry) => (
                                <tr key={entry.id}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground"><User className="inline h-4 w-4 mr-1.5 text-muted-foreground"/>{entry.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground"><Mail className="inline h-4 w-4 mr-1.5 text-muted-foreground"/>{entry.email}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground"><Phone className="inline h-4 w-4 mr-1.5 text-muted-foreground"/>{entry.contactNumber}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground"><CalendarDays className="inline h-4 w-4 mr-1.5 text-muted-foreground"/>{format(new Date(entry.submittedAt), "MMM d, yyyy - HH:mm")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm p-4 text-center">No signups for this product yet.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
