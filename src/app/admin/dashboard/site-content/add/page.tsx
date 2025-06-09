
"use client"; 

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addSiteContentItem } from "@/actions/site-content-actions";
import SiteContentForm from "../_components/SiteContentForm";
import { PlusCircle } from "lucide-react";
import type { CreateSiteContentItemInput } from "@/lib/schemas/site-content-schemas";

export default function AddSiteContentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateSiteContentItemInput) => {
    setIsSubmitting(true);
    const result = await addSiteContentItem(data);
    setIsSubmitting(false);
    return result;
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Add New Site Content</CardTitle>
              <CardDescription>Create a new banner, news item, or announcement.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SiteContentForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText="Add Content"
          />
        </CardContent>
      </Card>
    </div>
  );
}
