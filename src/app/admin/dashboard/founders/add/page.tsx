
"use client"; 

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addFounder } from "@/actions/founder-actions";
import FounderForm from "../_components/FounderForm";
import { UserPlus, Crown } from "lucide-react";

export default function AddFounderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await addFounder(formData);
    setIsSubmitting(false);
    return result;
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Add New Founder Profile</CardTitle>
              <CardDescription>Enter the details for the new founder profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FounderForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText="Add Founder Profile"
          />
        </CardContent>
      </Card>
    </div>
  );
}
