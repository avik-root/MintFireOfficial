
"use client";

import { useEffect, useState, useCallback, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteContentItemById, updateSiteContentItem } from "@/actions/site-content-actions";
import SiteContentForm from "../../_components/SiteContentForm";
import { Edit, Loader2, AlertTriangle } from "lucide-react";
import type { SiteContentItem, CreateSiteContentItemInput } from "@/lib/schemas/site-content-schemas";

export default function EditSiteContentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<SiteContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = use(paramsPromise);
  const itemId = params.id;

  const fetchItem = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getSiteContentItemById(itemId);
    if (result.item) {
      setItem(result.item);
    } else {
      setError(result.error || "Failed to load site content item.");
    }
    setIsLoading(false);
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSubmit = async (data: CreateSiteContentItemInput) => {
    setIsSubmitting(true);
    const result = await updateSiteContentItem(itemId, data);
    setIsSubmitting(false);
    if(result.success) {
      // Optionally refetch or update local state if needed, though router.refresh handles it.
      await fetchItem(); // Refetch to get latest version after update
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading site content item...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!item) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Site content item not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Edit className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Edit Site Content</CardTitle>
              <CardDescription>Update the details for this content item.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SiteContentForm 
            initialData={item}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Update Content"
          />
        </CardContent>
      </Card>
    </div>
  );
}
